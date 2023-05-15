import mongoose from "mongoose";
const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    unique: true,
  },
});

export default mongoose.model("Category", CategorySchema);
