// import { AuthenticationError, UserInputError } from "apollo-server-errors";
const { AuthenticationError, UserInputError } = require("apollo-server-errors");
// import { compare, hash } from "bcryptjs";
const { compare, hash } = require("bcryptjs");
const { createTokens } = require("../auth");
const { isAuthenticated } = require("../auth/isAuthenticated");
// import Posts from "../models/posts";
const Posts = require("../models/posts");
const User = require("../models/user");

const resolvers = {
  Query: {
    // getUsers: async () => await User.find({}).populate("posts").exec(),
    // getUserById: async (_, args) =>
    //   await User.findById(args.id).populate("posts").exec(),
    // me: async (_, __, { req }) => {
    //   if (!isAuthenticated(req)) {
    //     throw new Error("Not LoggedIn");
    //   }
    //   const user = await User.findById(req.userId).populate("posts").exec();
    //   return user;
    // },
    getPostById: async (_, args, { req }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not LoggedIn");
      }
      return await Posts.findById(args.id).populate("comments").exec();
    },
    getPostsByUser: async (_, args, { req }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not LoggedIn");
      }
      return Posts.find({ userId: req.userId }).exec();
    },
    getAllPosts: async () => await Posts.find({}).populate("comments").exec(),
  },
  Mutation: {
    createUser: async (_, args) => {
      args["password"] = await hash(args["password"], 10);
      const user = new User(args);
      await user.save();
      return user;
    },
    login: async (_, { email, password }, { res }) => {
      const user = await User.find({ email }).exec();
      if (!user.length) {
        throw new UserInputError("Invalid Details");
      }
      const valid = await compare(password, user[0].password);
      if (!valid) {
        throw new AuthenticationError("Wrong Credentials");
      }

      const { accessToken, refreshToken } = createTokens(user[0]);
      res.cookie("refresh-token", refreshToken);
      res.cookie("access-token", accessToken);

      return user[0];
    },
    invalidateTokens: async (_, __, { req }) => {
      if (!req.userId) {
        return false;
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return false;
      }
      user.count += 1;
      await user.save();

      return true;
    },
    createPost: async (_, args, { req, res }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not Logged In");
      }
      const userId = req.userId;
      const user = await User.findById(userId);
      const obj = { ...args, userId: req.userId };
      const post = new Posts(obj);
      await post.save();
      user.posts.push(post._id);
      user.save();
      return post;
    },
  },
};

module.exports = resolvers;
