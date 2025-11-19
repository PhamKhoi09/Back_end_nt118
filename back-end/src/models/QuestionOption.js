import { DataTypes } from "sequelize";
import sequelize from "../libs/sqlite.js";

const QuestionOption = sequelize.define("QuestionOption", {
  option_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  option_text: {
    type: DataTypes.TEXT, // Ví dụ: "Red"
  },
  option_image_url: {
    type: DataTypes.TEXT, // Ví dụ: Link ảnh cho dạng Nghe-Chọn hình
  },
  is_correct: {
    type: DataTypes.INTEGER, // 1 là đúng, 0 là sai
    defaultValue: 0,
    allowNull: false
  }
}, {
  tableName: 'Question_Options',
  timestamps: false
});

export default QuestionOption;