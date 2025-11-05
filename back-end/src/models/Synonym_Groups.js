// models/mysql/SynonymGroup.js
import { DataTypes } from "sequelize";
import sequelize from "../libs/sqlite.js";

const SynonymGroup = sequelize.define("SynonymGroup", {
  group_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  group_description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'Synonym_Groups',
  timestamps: false
});

export default SynonymGroup;