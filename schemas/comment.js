import mongoose, { Schema } from "mongoose";
const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
      minlength: 1,
    },
    recipe: {
      type: Schema.Types.ObjectId,
      ref: "Recipe",
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Comment", CommentSchema);
