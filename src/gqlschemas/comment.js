import { gql } from "apollo-server";
import Comment from "../../schemas/comment.js";
import { GraphQLError } from "graphql";
import { withAuth } from "../helpers/auth.js";

export const typeDefs = gql`
  type Comment {
    author: User!
    content: String!
    recipe: ID!
    likes: [User]
  }
  input PostCommentInput {
    content: String!
  }
  input EditCommentInput {
    idComment: ID!
    content: String!
  }

  type Query {
    commentsByRecipe(idRecipe: ID!): [Comment]!
    commentsCountByRecipe(idRecipe: ID!): Int!
    allComments: [Comment]!
    allCommentsCount: Int!
  }
  type Mutation {
    postComment(idRecipe: ID!, info: PostCommentInput!): Comment
    editComment(info: EditCommentInput): Comment
    deleteComment(idComment: ID!): DeleteResponse
    likeComment(idComment: ID!): Comment
    unLikeComment(idComment: ID!): Comment
  }
`;
export const resolvers = {
  Query: {
    commentsByRecipe: async (root, args) => {
      try {
        const comments = await Comment.find({ recipe: args.idRecipe })
          .populate("author")
          .populate("likes");

        return comments;
      } catch (error) {
        throw new GraphQLError("Error al obtener comentarios de la receta", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    },
    commentsCountByRecipe: async (root, args) => {
      try {
        const comments = await Comment.find({ recipe: args.idRecipe });
        return comments.length;
      } catch (error) {
        throw new GraphQLError(
          "Error al obtener la cantidad de comentarios de la receta",
          {
            extensions: {
              code: "UNRESOLVED",
              error,
            },
          }
        );
      }
    },
    allComments: async (root, args) => {
      try {
        const comments = Comment.find({}).populate("author").populate("likes");
        return comments;
      } catch (error) {
        throw new GraphQLError("Error al obtener todos los comentarios", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    },
    allCommentsCount: () => Comment.collection.countDocuments(),
  },
  Mutation: {
    postComment: withAuth(async (root, args, context) => {
      try {
        const comment = new Comment({
          content: args.info.content,
          author: context.currentUser._id,
          recipe: args.idRecipe,
        });
        const newComment = await comment.save();
        console.log({ newComment });

        return newComment.populate("author");
      } catch (error) {
        throw new GraphQLError("Error al postear comentario", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    }),
    editComment: withAuth(async (root, args, context) => {
      try {
        const { idComment, content } = args.info;
        await Comment.updateOne(
          { _id: idComment },
          {
            $set: {
              content,
            },
          }
        );
        const updateComment = await Comment.findById(idComment)
          .populate("author")
          .populate("likes");

        return updateComment;
      } catch (error) {
        throw new GraphQLError("Error al editar comentario", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    }),
    deleteComment: withAuth(async (root, args, context) => {
      try {
        await Comment.deleteOne({ _id: args.idComment });
        return { message: "Comentario eliminado exitosamente" };
      } catch (error) {
        throw new GraphQLError("Error al eliminar receta", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    }),
    likeComment: withAuth(async (root, args, context) => {
      try {
        const commentToLike = await Comment.findById(args.idComment);
        const alreadyLiking = commentToLike.likes.includes(
          context.currentUser._id
        );
        if (!alreadyLiking) {
          await Comment.updateOne(
            { _id: args.idComment },
            { $push: { likes: context.currentUser._id } }
          );
          const updateComment = await Comment.findById(args.idComment)
            .populate("author")
            .populate("likes");
          return updateComment;
        } else {
          throw new GraphQLError("Comentario ya likeado", {
            extensions: {
              code: "DUPLICATED",
            },
          });
        }
      } catch (error) {
        throw new GraphQLError("Error al likear comentario", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    }),
    unLikeComment: withAuth(async (root, args, context) => {
      try {
        const commentToLike = await Comment.findById(args.idComment);
        const alreadyLiking = commentToLike.likes.includes(
          context.currentUser._id
        );
        if (!alreadyLiking) {
          await Comment.updateOne(
            { _id: args.idComment },
            { $pull: { likes: context.currentUser._id } }
          );
          const updateComment = await Comment.findById(args.idComment)
            .populate("author")
            .populate("likes");
          return updateComment;
        } else {
          throw new GraphQLError("Comentario ya likeado", {
            extensions: {
              code: "DUPLICATED",
            },
          });
        }
      } catch (error) {
        throw new GraphQLError("Error al unlikear comentario", {
          extensions: {
            code: "UNRESOLVED",
            error,
          },
        });
      }
    }),
  },
};
