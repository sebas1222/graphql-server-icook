import { gql } from "apollo-server";
import Category from "../../schemas/category.js";
import { GraphQLError } from "graphql";

export const typeDefs = gql`
  type Category {
    name: String!
    id: ID!
  }
  input CategoryInput {
    name: String!
  }
  type Query {
    categoryCount: Int!
    allCategories: [Category]!
    findCategory(idCategory: ID!): Category
  }
  type Mutation {
    createCategory(info: CategoryInput): Category
  }
`;
export const resolvers = {
  Query: {
    categoryCount: (root, args) => Category.collection.countDocuments(),
    allCategories: async (root, args) => {
      try {
        const categories = await Category.find({});
        return categories;
      } catch (error) {
        throw new GraphQLError("Error al obtener categorías", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    },
    findCategory: async (root, args) => {
      try {
        const category = await Category.findById(args.idCategory);
        return category;
      } catch (error) {
        throw new GraphQLError("No se encontro la categoría solicitada", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    },
  },
  Mutation: {
    createCategory: async (root, args) => {
      try {
        const category = new Category({
          name: args.info.name,
        });
        const newCategory = await category.save();
        return newCategory;
      } catch (error) {
        throw new GraphQLError("Error al crear categoría", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    },
  },
};
