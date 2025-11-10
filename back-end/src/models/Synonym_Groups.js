// models/mysql/SynonymGroup.js
import { DataTypes } from "sequelize";
import sequelize from "../libs/sqlite.js";

const Synonym_Groups = sequelize.define("Synonym_Groups", {
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

export default Synonym_Groups;