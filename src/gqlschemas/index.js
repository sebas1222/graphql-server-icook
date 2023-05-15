import { gql } from "apollo-server";
import {
  typeDefs as userTypeDefs,
  resolvers as userResolvers,
} from "./user.js";
import {
  typeDefs as categoryTypeDefs,
  resolvers as categoryResolvers,
} from "./category.js";
import {
  typeDefs as recipeTypeDefs,
  resolvers as recipeResolvers,
} from "./recipe.js";
import {
  typeDefs as commentTypeDefs,
  resolvers as commentResolvers,
} from "./comment.js";

const rootTypeDefs = gql`
  type DeleteResponse {
    message: String!
  }
  type Query {
    _: String
  }
  type Mutation {
    _: String
  }
`;

export const resolvers = [
  userResolvers,
  categoryResolvers,
  recipeResolvers,
  commentResolvers,
];
export const typeDefs = [
  rootTypeDefs,
  userTypeDefs,
  categoryTypeDefs,
  recipeTypeDefs,
  commentTypeDefs,
];
