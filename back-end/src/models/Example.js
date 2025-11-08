// models/mysql/Example.js
import { DataTypes } from "sequelize";
import sequelize from "../libs/sqlite.js";

const Example = sequelize.define("Example", {
  example_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  definition_id: { // 👈 Khóa ngoại liên kết đến bảng Definition
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  example_sentence: { // 👈 Câu ví dụ bằng tiếng Anh
    type: DataTypes.TEXT,
    allowNull: false,
  },
  translation_sentence: { // 👈 Câu dịch nghĩa (nếu có)
    type: DataTypes.TEXT,
  }
}, {
  tableName: 'Example', // 👈 Chỉ rõ tên bảng
  timestamps: false
});

export default Example;