// libs/sqlite.js
import { Sequelize } from "sequelize";

// Khởi tạo kết nối Sequelize
const sequelize = new Sequelize({
  dialect: "sqlite", // 👈 Thay đổi quan trọng
  storage: "./Vocabulary.db", // 👈 Đường dẫn đến file database
  logging: console.log, // Hiện log SQL khi chạy
});

// Hàm để kiểm tra kết nối
export const connectSQLite = async () => {
  try {
    await sequelize.authenticate();
    console.log("Kết nối SQLite thành công!");
    
    // Đồng bộ models
    await sequelize.sync({ alter: false }); 
    console.log("Đã đồng bộ models của SQLite.");
    
  } catch (error) {
    console.error("Lỗi khi kết nối SQLite:", error);
    process.exit(1);
  }
};

export default sequelize; // Xuất ra instance để dùng trong models