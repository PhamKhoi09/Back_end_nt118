import { DataTypes } from "sequelize";
import sequelize from "../libs/posgre.js";

const MatchingPair = sequelize.define("MatchingPair", {
  pair_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  word_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
}, {
  tableName: 'Matching_Pairs',
  timestamps: false
});

export default MatchingPair;