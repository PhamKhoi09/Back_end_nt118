// models/mysql/UserTopicProgress.js
import { DataTypes } from "sequelize";
import sequelize from "../libs/posgre.js";
import Topic from "./Topics.js";

const UserTopicProgress = sequelize.define("UserTopicProgress", {
  progress_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  mongoUserId: { // 👈 Liên kết với User (từ MongoDB)
    type: DataTypes.STRING(24),
    allowNull: false,
    index: true,
  },
  topic_id: { // 👈 Liên kết với Topic (từ MySQL)
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Topic,
      key: 'topic_id'
    }
  },
  status: { // 👈 Trạng thái
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unlocked' // 'unlocked', 'completed'
  }
}, {
  tableName: 'UserTopicProgress',
  timestamps: true // Lần này nên dùng timestamps
});

Topic.hasMany(UserTopicProgress, { foreignKey: 'topic_id' });
UserTopicProgress.belongsTo(Topic, { foreignKey: 'topic_id' });

export default UserTopicProgress;