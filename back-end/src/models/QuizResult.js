import { DataTypes } from "sequelize";
import sequelize from "../libs/posgre.js";

const QuizResult = sequelize.define("QuizResult", {
  result_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quiz_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mongoUserId: {
    type: DataTypes.STRING(24), // ID từ MongoDB
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  passed: {
    type: DataTypes.INTEGER, // 1: Đậu, 0: Trượt
    defaultValue: 0,
  }
}, {
  tableName: 'Quiz_Results',
  timestamps: true // Bảng này nên có createdAt để biết làm lúc nào
});

export default QuizResult;