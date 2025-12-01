import mongoose from "mongoose";

const appRatingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Một user chỉ được đánh giá 1 lần (nếu đánh giá lại sẽ ghi đè)
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    }
  },
  {
    timestamps: true,
  }
);

const AppRating = mongoose.model("AppRating", appRatingSchema);
export default AppRating;