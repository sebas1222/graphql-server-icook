import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import User from "../../schemas/user.js";
dotenv.config();

export const decryptJWT = async (bearerToken) => {
  const token = bearerToken.replace("Bearer ", "");
  const { _id } = jwt.verify(token, process.env.JWT_ICOOK_SECRET);
  const currentUser = await User.findById(_id);
  if (currentUser) {
    return currentUser;
  } else {
    return {};
  }
};
