import { DataTypes } from "sequelize";
import sequelize from "../libs/sqlite.js";

const Question = sequelize.define("Question", {
  question_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quiz_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  question_type: {
    type: DataTypes.TEXT,
    allowNull: false, 
    // Các giá trị: 'LISTEN_CHOOSE_IMG', 'IMG_CHOOSE_TEXT', 'FILL_BLANK', 'MATCH_PAIRS'
  },
  prompt: {
    type: DataTypes.TEXT, // Câu hỏi hoặc hướng dẫn
  },
  image_url: {
    type: DataTypes.TEXT, // Dùng cho dạng Xem hình
  },
  audio_url: {
    type: DataTypes.TEXT, // Dùng cho dạng Nghe audio
  },
  correct_text_answer: {
    type: DataTypes.TEXT, // Dùng cho dạng Điền từ
  }
}, {
  tableName: 'Questions',
  timestamps: false
});

export default Question;