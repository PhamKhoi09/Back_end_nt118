import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// 1. Khởi tạo instance Sequelize (Vẫn cần cái này để export cho các Model dùng)
const sequelize = new Sequelize(process.env.SUPABASE_CONNECTION_STRING, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

// 2. Tạo hàm connect giống phong cách Mongoose bạn muốn
export const connectsupabase = async () => {
  try {
    // authenticate() là hàm kiểm tra kết nối của Sequelize
    await sequelize.authenticate();
    console.log("Liên kết Supabase (PostgreSQL) thành công!");
  } catch (error) {
    console.log("Lỗi khi kết nối Supabase:", error);
    process.exit(1); // Dừng chương trình nếu lỗi
  }
};

// 3. Export default instance để các Model sử dụng
export default sequelize;