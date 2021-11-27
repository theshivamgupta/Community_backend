// import User from "../../models/user";
const User = require("../../models/user");
// import { AuthenticationError, UserInputError } from "apollo-server-errors";
const { AuthenticationError, UserInputError } = require("apollo-server-errors");
// import { compare, hash } from "bcryptjs";
const { compare, hash } = require("bcryptjs");
// import { createTokens } from "../../auth";
const { createTokens } = require("../../auth");
// import { isAuthenticated } from "../../auth/isAuthenticated";
const { isAuthenticated } = require("../../auth/isAuthenticated");
// import { PubSub } from "graphql-subscriptions";
const { PubSub } = require("graphql-subscriptions");
const nodemailer = require("nodemailer");
// const nodemailerSendgrid = require("nodemailer-sendgrid");
const jwt = require("jsonwebtoken");

const ME = "ME";

const pubsub = new PubSub();
const EMAIL_SECRET = "afsg4wgsrgteahgdbsfs";

// const transport = nodemailer.createTransport(
//   nodemailerSendgrid({
//     apiKey: process.env.SENDGRID_API_KEY,
//   })
// );

let transporter = nodemailer.createTransport({
  // host: "smtp.ethereal.email",
  // port: 587,
  // secure: false, // true for 465, false for other ports
  service: "gmail",
  auth: {
    user: "shivamgupta3466@gmail.com", // generated ethereal user
    pass: "Chairmike@12", // generated ethereal password
  },
});

exports.userResolver = {
  Query: {
    getUsers: async () => await User.find({}).populate("posts").exec(),
    getUserByIdFromPost: async (_, args) =>
      await User.findById(args.id).populate("posts").exec(),
    getUserById: async (_, args) =>
      await User.findById(args.id).populate("posts").exec(),
    me: async (_, __, { req }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not LoggedIn");
      }
      const user = await User.findById(req.userId).populate("posts").exec();
      pubsub.publish(ME, {
        currentUser: user,
      });
      return user;
    },
    ifUserExists: async (_, args) => {
      let user = await User.find({ email: args.cred }).exec();
      let newUser = await User.find({ username: args.cred }).exec();
      if (newUser.length || user.length) {
        return true;
      }
      return false;
    },
  },
  Mutation: {
    createUser: async (_, args) => {
      args["password"] = await hash(args["password"], 10);
      const user = new User(args);
      await user.save();
      jwt.sign(
        {
          user: user?._id,
        },
        EMAIL_SECRET,
        {
          expiresIn: "1d",
        },
        async (err, emailToken) => {
          const url = `https://communitybackend.herokuapp.com/confirmation/${emailToken}`;
          let info = await transporter.sendMail({
            from: "shivamgupta3466@gmail.com",
            to: `${user.firstName} <${user.email}>`,
            subject: "Confirm Email",
            html: `Please click this email to confirm your email: <a href="${url}">${url}</a>`,
          });
          console.log(info.messageId);
        }
      );
      return user;
    },
    login: async (_, { email, password }, { res }) => {
      const user = await User.find({ email }).exec();
      // console.log({ user });
      if (!user.length) {
        throw new UserInputError("Invalid Details");
      }
      const valid = await compare(password, user[0].password);
      // console.log({ valid });
      if (!valid) {
        throw new AuthenticationError("Wrong Credentials");
      }

      const { accessToken, refreshToken } = createTokens(user[0]);
      res.cookie("refresh-token", refreshToken, {
        secure: true,
        sameSite: "none",
        httpOnly: false,
      });
      res.cookie("access-token", accessToken, {
        secure: true,
        sameSite: "none",
        httpOnly: false,
      });
      // localStorage.setItem("access-token", accessToken);
      // localStorage.setItem("refresh-token", refreshToken);
      // return user[0];
      return {
        user: user[0],
        refreshToken,
        accessToken,
      };
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
    logout: async (_, __, { req, res }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not LoggedIn");
      }
      res.clearCookie("access-token");
      res.clearCookie("refresh-token");
      return true;
    },
  },
  Subscription: {
    currentUser: {
      subscribe: (_, __, { req, res }) => pubsub.asyncIterator(ME),
    },
  },
};
