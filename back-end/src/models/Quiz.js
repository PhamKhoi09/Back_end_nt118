import { DataTypes } from "sequelize";
import sequelize from "../libs/sqlite.js";// Sửa đường dẫn nếu cần

const Quiz = sequelize.define("Quiz", {
  quiz_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  topic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // Một Topic chỉ có 1 Quiz
    // Khóa ngoại sẽ được định nghĩa trong index.js
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  
  passing_score: {
    type: DataTypes.INTEGER,
    defaultValue: 80, // Mặc định 80 điểm là đậu
    allowNull: false,
  },
    duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: 'Quizzes',
  timestamps: false
});

export default Quiz;