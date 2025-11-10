// models/mysql/POS.js
import { DataTypes } from "sequelize";
import sequelize from "../libs/sqlite.js";

const POS = sequelize.define("POS", {
  pos_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  pos_name: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  pos_abbreviation: {
    type: DataTypes.TEXT
  },
  pos_name_vie: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'POS',
  timestamps: false
});

export default POS;