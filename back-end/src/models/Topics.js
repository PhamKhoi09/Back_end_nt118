// models/mysql/Topic.js
import { DataTypes } from "sequelize";
import sequelize from "../libs/sqlite.js";

const Topics = sequelize.define("Topics", {
  topic_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  topic_name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  difficulty: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'Topics', // 👈 Chỉ rõ tên bảng
  timestamps: false
});

export default Topics;