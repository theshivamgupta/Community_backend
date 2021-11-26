require("dotenv").config();

// import { ApolloServer } from "apollo-server-express";
const ApolloServer = require("apollo-server-express").ApolloServer;
// import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
const ApolloServerPluginLandingPageGraphQLPlayground =
  require("apollo-server-core").ApolloServerPluginLandingPageGraphQLPlayground;
// import express from "express";
const express = require("express");
// import mongoose from "mongoose";
const mongoose = require("mongoose");
// import cors from "cors";
const cors = require("cors");
// import cookieParser from "cookie-parser";
const cookieParser = require("cookie-parser");
// import { createTokens } from "./auth";
const { createTokens } = require("./auth");
// import User from "./models/user";
const User = require("./models/user");
// import { verify } from "jsonwebtoken";
const verify = require("jsonwebtoken").verify;
// import { createServer } from "http";
const createServer = require("http").createServer;
// import typeDefs from "./graphql/typeDefs";
const typeDefs = require("./graphql/typeDefs");
// import { PubSub } from "graphql-subscriptions";
const { PubSub } = require("graphql-subscriptions");
// import { SubscriptionServer } from "subscriptions-transport-ws";
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { execute, subscribe } = require("graphql");
const { makeExecutableSchema } = require("@graphql-tools/schema");
// import { userResolver } from "./graphql/resolvers/userResolvers";
const { userResolver } = require("./graphql/resolvers/userResolvers");
// import { postResolver } from "./graphql/resolvers/postResolvers";
const { postResolver } = require("./graphql/resolvers/postResolvers");
// import { commentResolver } from "./graphql/resolvers/commentResolver";
const { commentResolver } = require("./graphql/resolvers/commentResolver");

async function startApolloServer() {
  const pubsub = new PubSub();
  const app = express();
  const httpServer = createServer(app);
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(cookieParser());

  app.use(async (req, res, next) => {
    const refreshToken = req.cookies["refresh-token"];
    const accessToken = req.cookies["access-token"];
    if (!refreshToken && !accessToken) {
      return next();
    }

    try {
      const data = verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      req.userId = data.userId;
      return next();
    } catch (err) {
      console.log(err);
    }

    if (!refreshToken) {
      return next();
    }

    let data;
    try {
      data = verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      console.log(err);
      return next();
    }
    const user = await User.findById(data.userId);
    // token has been invalidated
    if (!user || user.count !== data.count) {
      return next();
    }

    const tokens = createTokens(user);

    res.cookie("refresh-token", tokens.refreshToken);
    res.cookie("access-token", tokens.accessToken);
    req.userId = user.id;
    next();
  });
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: [userResolver, postResolver, commentResolver],
  });
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    { server: httpServer, path: "/graphql" }
  );
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground,
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
    context: ({ req, res }) => ({ req, res, pubsub }),
  });
  await server.start();
  mongoose
    .connect(process.env.DATABASE_URL)
    .then(() => console.log("Database connected!"))
    .catch((err) => console.log(err));
  server.applyMiddleware({ app, cors: false });

  // await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
  // app.listen({ port: 4000 }, () =>
  //   console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  // );
  httpServer.listen(process.env.PORT || "4000", () => {
    console.log(
      `🚀 Query endpoint ready at http://localhost:4000${server.graphqlPath}`
    );
    console.log(
      `🚀 Subscription endpoint ready at ws://localhost:4000${server.graphqlPath}`
    );
  });
}

startApolloServer();
