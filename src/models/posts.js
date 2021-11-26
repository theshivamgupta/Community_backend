var mongoose = require("mongoose");
const User = require("./user");
const Comment = require("./comment");

var postsSchema = new mongoose.Schema(
  {
    postImage: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      maxlength: 64,
      trim: true,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Comment,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postsSchema);
