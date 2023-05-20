import { gql } from "apollo-server";
import User from "../../schemas/user.js";
import brcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";
import * as dotenv from "dotenv";
import { withAuth } from "../helpers/auth.js";
import Recipe from "../../schemas/recipe.js";

dotenv.config();

export const typeDefs = gql`
  type User {
    name: String!
    email: String!
    password: String!
    following: [User]!
    followers: [User]!
    avatar: String
    id: ID!
  }
  input CreateUserInput {
    name: String!
    email: String!
    password: String!
  }
  input LoginUserInput {
    email: String!
    password: String!
  }
  type LoginResponse {
    authToken: String!
    userInfo: User
  }
  type Query {
    userCount: Int!
    allUsers: [User]!
    findUser(idUser: ID!): User!
  }
  type Mutation {
    createUser(credentials: CreateUserInput): User
    loginUser(credentials: LoginUserInput): LoginResponse
    deleteUser(idUser: ID!): DeleteResponse
    updateAvatar(avatarUri: String!): User
    followUser(idUser: ID!): User
    unFollowUser(idUser: ID!): User
  }
`;
export const resolvers = {
  Query: {
    userCount: (root, args) => User.collection.countDocuments(),
    allUsers: async (root, args) => {
      try {
        const users = await User.find({})
          .populate("followers")
          .populate("following");
        return users;
      } catch (error) {
        throw new GraphQLError("Error al obtener los usuarios", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    },
    findUser: async (root, args) => {
      try {
        const user = await User.findById(args.idUser)
          .populate({
            path: "following",
            populate: [
              {
                path: "followers",
              },
              { path: "following" },
            ],
          })
          .populate({
            path: "followers",
            populate: [
              {
                path: "followers",
              },
              { path: "following" },
            ],
          });
        return user;
      } catch (error) {
        throw new GraphQLError("Error al obtener el usuario solicitado", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    },
  },
  Mutation: {
    createUser: async (root, args) => {
      try {
        const { email, name, password } = args.credentials;
        const verifiedEmail = await User.findOne({ email });
        if (verifiedEmail) {
          throw new Error("Correo ya registrado");
        } else {
          const passwordHash = await brcrypt.hash(password, 10);
          const user = new User({
            name,
            email,
            password: passwordHash,
          });
          const newUser = await user.save();
          return newUser;
        }
      } catch (error) {
        throw new GraphQLError("Error al crear usuario", {
          extensions: {
            code: "UNRESOLVED",
            error: error.message,
          },
        });
      }
    },
    loginUser: async (root, args) => {
      const { password, email } = args.credentials;
      try {
        const userRef = await User.findOne({ email })
          .select("+password -__v -createdAt -updatedAt")
          .populate("followers")
          .populate("following");
        if (userRef) {
          const match = await brcrypt.compare(password, userRef.password);
          if (match) {
            const objectToTokenized = userRef.toObject();
            delete objectToTokenized.password;
            const authToken = jwt.sign(
              objectToTokenized,
              process.env.JWT_ICOOK_SECRET,
              { algorithm: "HS256" }
            );
            return {
              authToken,
              userInfo: userRef,
            };
          } else {
            throw new Error("Credenciales erróneas");
          }
        } else {
          throw Error("Correo no registrado");
        }
      } catch (error) {
        throw new GraphQLError("Error al iniciar sesión", {
          extensions: {
            code: "UNRESOLVED",
            error: error.message,
          },
        });
      }
    },
    updateAvatar: withAuth(async (root, args, context) => {
      try {
        await User.findOneAndUpdate(
          { _id: context.currentUser._id },
          {
            $set: {
              avatar: args.avatarUri,
            },
          }
        );
        const updatedUser = User.findOne({ _id: context.currentUser._id })
          .populate("followers")
          .populate("following");
        return updatedUser;
      } catch (error) {
        throw new GraphQLError("Error al actualizar avatar", {
          extensions: {
            code: "UNRESOLVED",
            error: error.message,
          },
        });
      }
    }),
    deleteUser: withAuth(async (root, args) => {
      if (context.currentUser) {
        try {
          await User.deleteOne({ _id: context.currentUser._id });
          return { message: "Cuenta eliminada exitosamente" };
        } catch (error) {
          throw new GraphQLError("Error al eliminar la cuenta", {
            extensions: {
              code: "UNRESOLVED",
              error,
            },
          });
        }
      } else {
        throw new GraphQLError("Usuario no autenticado", {
          extensions: {
            code: "UNAUTHENTICATED",
          },
        });
      }
    }),
    followUser: withAuth(async (root, args, context) => {
      try {
        //obtenemos el documento correspondiente al usuario que va a seguir
        const userWhoFollows = await User.findById(context.currentUser._id);
        //verificamos si es que se intenta seguir a alquien que ya se sigue
        const alreadyFollowing = userWhoFollows.following.includes(args.idUser);
        if (!alreadyFollowing) {
          //si no se sigue se ejecuta la logica para seguir al usuario
          //se actualiza el campo following del usuario que seguira con el usuario a seguir
          const addFollowing = User.updateOne(
            { _id: context.currentUser._id },
            { $push: { following: args.idUser } }
          );
          //por otra parte se actualiza el campo followers del usuario que se seguira
          const addFollower = User.updateOne(
            { _id: args.idUser },
            { $push: { followers: context.currentUser._id } }
          );
          await Promise.all([addFollowing, addFollower]);
          //luego de que se realizen las 2 queries se llama al usuario de nuevo con su informacion actualizada
          const updateUserWhoFollows = await User.findById(
            context.currentUser._id
          )
            .populate("following")
            .populate("followers");
          // se retorna el documento del usuario con su informacion actualizada
          return updateUserWhoFollows;
        } else {
          throw new GraphQLError("Usuario ya seguido", {
            extensions: {
              code: "DUPLICATED",
            },
          });
        }
      } catch (error) {
        return new GraphQLError("Error al actualizar información", {
          extensions: {
            code: "MONGODB_SERVER_ERROR",
            error,
          },
        });
      }
    }),
    unFollowUser: withAuth(async (root, args, context) => {
      if (context.currentUser) {
        // se actualizan los valores de los campos following y followers como anteriormente se menciono
        try {
          const removeFollowing = User.updateOne(
            { _id: context.currentUser._id },
            { $pull: { following: args.idUser } }
          );
          const removeFollower = User.updateOne(
            { _id: args.idUser },
            { $pull: { followers: context.currentUser._id } }
          );
          await Promise.all([removeFollowing, removeFollower]);
          // de nuevo luego de que se realizan las 2 queries se realizen se llama
          // al usuario de nuevo con su informacion actualizada
          const userWhoUnFollows = await User.findById(context.currentUser._id)
            .populate("followers")
            .populate("following");
          // se retorna el documento del usuario con su informacion actualizada
          return userWhoUnFollows;
        } catch (error) {
          return new GraphQLError("Error al actualizar información", {
            extensions: {
              code: "MONGODB_SERVER_ERROR",
              error,
            },
          });
        }
      } else {
        throw new GraphQLError("Usuario no autenticado", {
          extensions: {
            code: "UNAUTHENTICATED",
          },
        });
      }
    }),
  },
};
