// import { isAuthenticated } from "../../auth/isAuthenticated";
const { isAuthenticated } = require("../../auth/isAuthenticated");
// import Comment from "../../models/comment";
const Comment = require("../../models/comment");
// import Posts from "../../models/posts";
const Posts = require("../../models/posts");
// import User from "../../models/user";
const User = require("../../models/user");
// import { PubSub, withFilter } from "graphql-subscriptions";
const { PubSub, withFilter } = require("graphql-subscriptions");

const pubsub = new PubSub();
const NEW_COMMENT = "NEW_COMMENT";

exports.commentResolver = {
  Query: {
    getCommentById: async (_, args, { req }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not LoggedIn");
      }
      const comment = await Comment.findById(args.id);
      return comment;
    },
    getCommentsByPostId: async (_, args, { req }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not LoggedIn");
      }
      const comments = await Comment.find({ postId: args.postId })
        .sort({ createdAt: "asc" })
        .exec();
      return comments;
    },
    getAllFlaggedComments: async (_, __, { req }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not LoggedIn");
      }
      const comments = await Comment.find({ flagged: true }).exec();
      return comments;
    },
  },
  Mutation: {
    createComment: async (_, args, { req, res }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not LoggedIn");
      }
      const userId = req.userId;
      const comment = new Comment({ ...args, userId });
      await comment.save();
      const post = await Posts.findById(args.postId);
      post.comments.push(comment._id);
      await post.save();
      pubsub.publish(NEW_COMMENT, {
        onCommentAdded: comment,
      });
      return comment;
    },
    flagComment: async (_, args, { req, res }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not Logged In");
      }
      const currentUserId = req.userId;
      const user = await User.findById(currentUserId);
      if (user.moderatorLevel > 2) {
        throw new Error("Not Authorized to flag Post");
      }
      const comment = await Comment.findById(args.commentId);
      comment.flagged = true;
      await comment.save();
      return comment;
    },
    deleteComment: async (_, args, { req }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not LoggedIn");
      }
      const currentUserId = req.userId;
      const comment = await Comment.findById(args.commentId);
      if (comment.userId !== currentUserId) {
        throw new Error("Not your comment to delete");
      }
      await Comment.findByIdAndDelete(args.commentId);
      return true;
    },
    deleteFlaggedComment: async (_, args, { req }) => {
      if (!isAuthenticated(req)) {
        throw new Error("Not Logged In");
      }
      const comment = await Comment.findById(args.commentId);
      if (!comment) {
        throw new Error("Comment not found");
      }
      if (!comment.flagged) {
        throw new Error("This Comment is not flagged");
      }
      const currentUser = await User.findById(req.userId);
      if (currentUser.moderatorLevel > 1) {
        throw new Error("You do not have the Authority to delete this Post");
      }
      const user = await User.findById(comment.userId);
      user.reportCount += 1;
      await user.save();
      const deletedComment = await Comment.findByIdAndDelete(
        args.commentId
      ).exec();
      if (!deletedComment) {
        throw new Error("Comment not found");
      }
      // console.log({ deletedPost });
      return true;
    },
  },
  Subscription: {
    onCommentAdded: {
      subscribe: withFilter(
        (_, __, { req, res }) => pubsub.asyncIterator(NEW_COMMENT),
        (payload, variables) => {
          return payload.onCommentAdded.postId === variables.postId;
        }
      ),
      // subscribe: (_, __, { req, res }) => pubsub.asyncIterator(NEW_COMMENT),
    },
  },
};
