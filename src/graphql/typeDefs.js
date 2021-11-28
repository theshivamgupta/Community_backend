// import { gql } from "apollo-server-express";
const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Comment {
    id: ID!
    content: String!
    postId: String!
    userId: String!
    createdAt: String!
    flagged: Boolean!
  }
  type Post {
    id: ID!
    title: String!
    content: String!
    postImage: String!
    userId: String!
    comments: [Comment]
    flagged: Boolean!
    createdAt: String
  }
  type User {
    id: ID!
    firstName: String
    lastName: String
    username: String
    email: String!
    password: String!
    profileImage: String
    confirmed: Boolean!
    affiliation: String
    moderatorLevel: Int
    reporterCount: Int
    posts: [Post]
    comments: [Comment]
  }
  type LoggedInUser {
    accessToken: String!
    refreshToken: String!
    user: User!
  }
  type Book {
    title: String!
    author: String!
  }
  type Query {
    getUsers: [User]!
    getUserById(id: ID!): User!
    getUserByIdFromPost(id: String!): User!
    me: User!
    getPostById(id: ID!): Post!
    getPostsByUser(id: String!): [Post]
    getAllPosts: [Post]
    getAllFlaggedPosts: [Post]
    getCommentsByPostId(postId: String!): [Comment]
    getCommentById(id: ID!): Comment!
    getAllFlaggedComments: [Comment]
    ifUserExists(cred: String!): Boolean!
    getStudentUsers: [User]!
  }
  type Mutation {
    createUser(
      email: String!
      password: String!
      affiliation: String!
      username: String!
      firstName: String!
      lastName: String!
      moderatorLevel: Int
    ): User!
    login(email: String!, password: String!): LoggedInUser!
    updateProfileImage(profileImage: String!): User!
    logout: Boolean!
    invalidateTokens: Boolean!
    createPost(postImage: String!, title: String!, content: String!): Post!
    flagPost(postId: ID!): Post!
    deletePost(postId: ID!): Boolean!
    deleteFlaggedPost(postId: ID!): Boolean!
    createComment(content: String!, postId: String!): Comment!
    flagComment(commentId: ID!): Comment!
    deleteComment(commentId: ID!): Boolean!
    deleteFlaggedComment(commentId: ID!): Boolean!
  }
  type Subscription {
    currentUser: User!
    getPost(id: ID!): Post!
    onCommentAdded(postId: String!): Comment!
  }
`;

module.exports = typeDefs;
