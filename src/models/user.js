// import mongoose from "mongoose";
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
// import Post from "./posts";
const Post = require("./posts");

var validateEmail = function (email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

var userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      maxlength: 32,
      trim: true,
    },
    lastName: {
      type: String,
      maxlength: 32,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      validate: [validateEmail, "Please fill a valid email address"],
    },
    profileImage: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    affiliation: {
      type: String,
      required: true,
    },
    // if 0 then may be teacher or a student with highest moderation power
    // if 1 then power to delete post or report directly to 0 level
    // if 2 can only report to 1 level moderator
    // if 3 normal student no authorization
    moderatorLevel: {
      type: Number,
      default: 2,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    count: {
      type: Number,
      default: 0,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Post,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
