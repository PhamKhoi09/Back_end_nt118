// models/mysql/WordFamily.js (Nên đặt tên file là số ít)
import { DataTypes } from "sequelize";
import sequelize from "../libs/posgre.js";

const Word_Families = sequelize.define("Word_Families", {
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

export default Word_Families;