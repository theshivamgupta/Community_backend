// import User from "../../models/user";
// import Posts from "../../models/posts";
const Posts = require("../../models/posts");
const User = require("../../models/user");
// import { isAuthenticated } from "../../auth/isAuthenticated";
const { isAuthenticated } = require("../../auth/isAuthenticated");
// import { PubSub, withFilter } from "graphql-subscriptions";
const { PubSub, withFilter } = require("graphql-subscriptions");

const pubsub = new PubSub();

const GET_POST = "GET_POST";

exports.postResolver = {
  Query: {
    getPostById: async (_, args, { req }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not LoggedIn");
      }
      const post = await Posts.findById(args.id).populate("comments").exec();
      pubsub.publish(GET_POST, {
        getPost: post,
      });
      return post;
    },
    getPostsByUser: async (_, args, { req }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not LoggedIn");
      }
      return Posts.find({ userId: req.userId }).exec();
    },
    getAllPosts: async () => await Posts.find({}).populate("comments").exec(),
    getAllFlaggedPosts: async (_, __, { req }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not LoggedIn");
      }
      return await Posts.find({ flagged: true }).populate("comments").exec();
    },
  },
  Mutation: {
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
    flagPost: async (_, args, { req, res }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not Logged In");
      }
      const currentUserId = req.userId;
      const user = await User.findById(currentUserId);
      if (user.moderatorLevel > 2) {
        throw new Error("Not Authorized to flag Post");
      }
      const post = await Posts.findById(args.postId);
      post.flagged = true;
      await post.save();
      return post;
    },
    deletePost: async (_, args, { req }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not Logged In");
      }
      const currentUserId = req.userId;
      const post = await Posts.findById(args.postId);
      if (currentUserId !== post.userId) {
        throw new Error("This is not your post");
      }
      await Posts.findByIdAndDelete(args.postId).exec();
      return true;
    },
    deleteFlaggedPost: async (_, args, { req }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not Logged In");
      }
      const post = await Posts.findById(args.postId);
      if (!post) {
        throw new Error("Post not found");
      }
      if (!post.flagged) {
        throw new Error("This Post is not flagged");
      }
      const currentUser = await User.findById(req.userId);
      if (currentUser.moderatorLevel !== 0) {
        throw new Error("You do not have the Authority to delete this Post");
      }
      const user = await User.findById(post.userId);
      user.reportCount += 1;
      await user.save();
      const deletedPost = await Posts.findByIdAndDelete(args.postId).exec();
      if (!deletedPost) {
        throw new Error("Post not found");
      }
      console.log({ deletedPost });
      return true;
    },
  },
  Subscription: {
    getPost: {
      subscribe: withFilter(
        (_, __, { req, res }) => pubsub.asyncIterator(GET_POST),
        (payload, variables) => {
          return payload.getPost.id === variables.id;
        }
      ),
    },
  },
};
