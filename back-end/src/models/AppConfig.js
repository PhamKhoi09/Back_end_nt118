import mongoose from "mongoose";

const appConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true, // Ví dụ: "android_version", "ios_version", "maintenance_mode"
    },
    value: {
      type: mongoose.Schema.Types.Mixed, // Cho phép lưu chuỗi, số, hoặc boolean
      required: true,
    },
    description: String // Mô tả cho Admin dễ hiểu
  },
  {
    timestamps: true,
  }
);

const AppConfig = mongoose.model("AppConfig", appConfigSchema);
export default AppConfig;