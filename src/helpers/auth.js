import { GraphQLError } from "graphql";
import { decryptJWT } from "./decrypt.js";

export const withAuth = (resolver) => {
  return async (root, args, context, info) => {
    const bearerToken = context.req.headers.authorization || "";

    if (bearerToken) {
      try {
        const currentUser = await decryptJWT(bearerToken);
        return resolver(root, args, { ...context, currentUser }, info);
      } catch (error) {
        throw new GraphQLError("Error al obtener el token", {
          extensions: {
            code: "TOKEN_UNRESOLVED",
            error,
            tokenBearer: bearerToken,
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
  };
};
