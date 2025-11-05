// models/mysql/WordFamily.js (Nên đặt tên file là số ít)
import { DataTypes } from "sequelize";
import sequelize from "../libs/sqlite.js";

const WordFamily = sequelize.define("WordFamily", {
  family_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  family_description: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'Word_Families',
  timestamps: false
});

export default WordFamily;