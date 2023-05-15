import { gql } from "apollo-server";
import Recipe from "../../schemas/recipe.js";
import { GraphQLError } from "graphql";
import { withAuth } from "../helpers/auth.js";

export const typeDefs = gql`
  type Recipe {
    name: String!
    description: String!
    duration: Int!
    images: [String]
    author: User!
    category: Category!
    ingredients: [String]!
    steps: [Step]!
    likes: [User]
    id: ID!
  }
  input RecipeInput {
    name: String
    description: String
    duration: Int
    images: [String]
    category: ID
    ingredients: [String]
    steps: [StepInput]
  }
  input StepInput {
    step_number: Int!
    description: String!
  }

  type Step {
    step_number: Int!
    description: String!
  }
  type Query {
    recipeCount: Int!
    allRecipes: [Recipe]!
    findRecipe(idRecipe: ID!): Recipe!
    recipesByCategory(idCategory: ID!): [Recipe]!
    recipesByUser(idUser: ID!): [Recipe]!
  }
  type Mutation {
    createRecipe(info: RecipeInput): Recipe
    updateRecipe(idRecipe: ID!, info: RecipeInput): Recipe
    deleteRecipe(idRecipe: ID!): DeleteResponse
    likeRecipe(idRecipe: ID!): Recipe
    unlikeRecipe(idRecipe: ID!): Recipe
  }
`;

export const resolvers = {
  Query: {
    recipeCount: (root, args) => Recipe.collection.countDocuments(),
    allRecipes: async (root, args) => {
      try {
        const recipes = await Recipe.find({})
          .populate("author")
          .populate("category")
          .populate("likes");
        recipes.forEach((recipe) =>
          recipe.steps.sort((a, b) => a.step_number - b.step_number)
        );
        return recipes;
      } catch (error) {
        throw new GraphQLError("Error al obtener las recetas", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    },
    findRecipe: async (root, args) => {
      try {
        const recipe = await Recipe.findById(args.idRecipe)
          .populate("author")
          .populate("category")
          .populate("likes");
        recipe.steps.sort((a, b) => a.step_number - b.step_number);
        return recipe;
      } catch (error) {
        throw new GraphQLError("Error al obtener la receta solicitada", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    },
    recipesByCategory: async (root, args) => {
      try {
        const recipes = await Recipe.find({ category: args.idCategory });
        return recipes;
      } catch (error) {
        throw new GraphQLError("Error al obtener las recetas por categoría", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    },
    recipesByUser: async (root, args) => {
      try {
        const recipes = await Recipe.find({ author: args.idUser })
          .populate("author")
          .populate("category")
          .populate("likes");
        recipes.forEach((recipe) =>
          recipe.steps.sort((a, b) => a.step_number - b.step_number)
        );
        return recipes;
      } catch (error) {
        throw new GraphQLError("Error al obtener las recetas por usuario", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    },
  },
  Mutation: {
    createRecipe: withAuth(async (root, args, context) => {
      const {
        name,
        description,
        duration,
        category,
        ingredients,
        steps,
        images,
      } = args.info;
      console.log(images);
      const recipe = new Recipe({
        author: context.currentUser._id,
        name,
        description,
        duration,
        category,
        images,
        ingredients,
        steps,
      });
      try {
        const newRecipe = await recipe.save();
        const recipeToSend = await Recipe.findById(newRecipe._id)
          .populate("author")
          .populate("category")
          .populate("likes");
        recipeToSend.steps.sort((a, b) => a.step_number - b.step_number);
        console.log({ recipeToSend });
        return recipeToSend;
      } catch (error) {
        throw new GraphQLError("Error al crear receta", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    }),
    deleteRecipe: withAuth(async (root, args, context) => {
      try {
        await Recipe.deleteOne({ _id: args.idRecipe });
        return { message: "Receta eliminada exitosamente" };
      } catch (error) {
        throw new GraphQLError("Error al eliminar receta", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    }),
    updateRecipe: withAuth(async (root, args, context, { file }) => {
      const { name, description, duration, category, ingredients, steps } =
        args.info;
      console.log(file);
      try {
        await Recipe.updateOne(
          { _id: args.idRecipe },
          {
            $set: {
              name,
              description,
              duration,
              category,
              ingredients,
              steps,
            },
          }
        );
        const updateRecipe = await Recipe.findById(args.idRecipe)
          .populate("author")
          .populate("category")
          .populate("likes");
        updateRecipe.steps.sort((a, b) => a.step_number - b.step_number);
        return updateRecipe;
      } catch (error) {
        throw new GraphQLError("Error al actualizar receta", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    }),
    likeRecipe: withAuth(async (root, args, context) => {
      try {
        const recipeToLike = await Recipe.findById(args.idRecipe);
        const alreadyLiking = recipeToLike.likes.includes(
          context.currentUser._id
        );

        if (!alreadyLiking) {
          await Recipe.updateOne(
            { _id: args.idRecipe },
            { $push: { likes: context.currentUser._id } }
          );
          const updateRecipe = await Recipe.findById(args.idRecipe)
            .populate("likes")
            .populate("author")
            .populate("category");
          updateRecipe.sort((a, b) => a.step_number - b.step_number);
          return updateRecipe;
        } else {
          throw new GraphQLError("Receta ya en favoritos", {
            extensions: {
              code: "DUPLICATED",
            },
          });
        }
      } catch (error) {
        throw new GraphQLError("Error al añadir a favoritos", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    }),
    unlikeRecipe: withAuth(async (root, args, context) => {
      try {
        await Recipe.updateOne(
          { _id: args.idRecipe },
          { $pull: { likes: context.currentUser._id } }
        );
        const updateRecipe = await Recipe.findById(args.idRecipe)
          .populate("likes")
          .populate("actor")
          .populate("category");
        updateRecipe.sort((a, b) => a.step_number - b.step_number);
        return updateRecipe;
      } catch (error) {
        throw new GraphQLError("Error al eliminar de favoritos", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    }),
  },
};
