import mongoose, { Schema } from "mongoose";
const RecipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    images: [String],
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    ingredients: {
      type: [String],
      required: true,
    },
    steps: {
      type: [{ step_number: Number, description: String }],
      required: true,
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
export default mongoose.model("Recipe", RecipeSchema);
