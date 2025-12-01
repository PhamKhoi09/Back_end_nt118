import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,//bat buoc phai co giatri
      unique: true,//doc nhat
      trim: true,// tu bo khoang trang o dau va cuoi
      lowercase: true,// chyen het ve chu thuong
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatarUrl: {
      type: String, // link CDN để hiển thị hình
    },
    avatarId: {
      type: String, // Cloudinary public_id để xoá hình
    },
    phone: {
      type: String,
      sparse: true, // cho phép null, nhưng không được trùng
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    }
  },
  {
    timestamps: true,// để bên mongoDB tự thêm trường createdAt và updatedAt
  }
);

const User = mongoose.model("User", userSchema);
export default User;