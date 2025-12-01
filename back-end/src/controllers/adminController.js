// controllers/adminController.js
import User from "../models/User.js";
import Session from "../models/Session.js";
import { QuizResult, Quiz, Topics } from "../models/index.js"; // Import từ MySQL
import sequelize from "../libs/sqlite.js"; // Hoặc mysql.js tùy file kết nối của bạn
import AppRating from "../models/AppRating.js";
import AppConfig from "../models/AppConfig.js";
// 1. Thống kê Tổng quan (Dashboard Header)
export const getDashboardStats = async (req, res) => {
  try {
    // A. Tổng User
    const totalUsers = await User.countDocuments({ role: "user" });

    const ratingStats = await AppRating.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" }, // Tính trung bình cột rating
          totalRatings: { $sum: 1 } // Đếm số lượng đánh giá
        }
      }
    ]);

    const avgRating = ratingStats.length > 0 ? parseFloat(ratingStats[0].averageRating.toFixed(1)) : 0;
    const totalRatingCount = ratingStats.length > 0 ? ratingStats[0].totalRatings : 0;

    // ❗️ BỔ SUNG: Lấy App Version từ DB
    let versionConfig = await AppConfig.findOne({ key: "android_version" });

    // Nếu chưa có trong DB (lần đầu chạy), tạo mặc định
    if (!versionConfig) {
      versionConfig = await AppConfig.create({
        key: "android_version",
        value: "1.0.0",
        description: "Phiên bản hiện tại của ứng dụng Android"
      });
    }
    return res.status(200).json({
      totalUsers,
      appVersion: versionConfig.value,
      rating: {
        average: avgRating,  // Ví dụ: 4.5
        count: totalRatingCount // Ví dụ: 120 users
      } // Hardcode hoặc lấy từ DB config
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};


// 3. Top Users by Quiz Completion (Top 10 User hoàn thành nhiều quiz nhất)
export const getTopQuizzes = async (req, res) => {
  try {
    // BƯỚC 1: Truy vấn MySQL để đếm số bài đã pass của từng user
    const topUsersRaw = await QuizResult.findAll({
      attributes: [
        'mongoUserId',
        [
            sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('quiz_id'))), 
            'passed_count'
        ]
      ],
      where: { passed: 1 }, // Chỉ tính bài đã đậu
      group: ['mongoUserId'], // Gom nhóm theo User
      order: [[sequelize.literal('passed_count'), 'DESC']], // Sắp xếp giảm dần
      limit: 10 // Lấy top 10
    });

    if (!topUsersRaw || topUsersRaw.length === 0) {
        return res.status(200).json([]);
    }

    // BƯỚC 2: Lấy danh sách ID từ kết quả trên
    const userIds = topUsersRaw.map(item => item.mongoUserId);
    const scoreMap = {}; // Tạo map để tra cứu nhanh { "userId": count }
    topUsersRaw.forEach(item => {
        scoreMap[item.mongoUserId] = item.get('passed_count');
    });

    // BƯỚC 3: Truy vấn MongoDB để lấy thông tin (Tên, Avatar) của các user này
    const usersInfo = await User.find({ 
        _id: { $in: userIds } 
    }).select('username avatarUrl email');

    // BƯỚC 4: Gộp dữ liệu và Format kết quả trả về
    // Chúng ta map theo danh sách topUsersRaw để đảm bảo giữ đúng thứ tự xếp hạng
    const formatted = topUsersRaw.map(rawItem => {
        const uid = rawItem.mongoUserId;
        const userProfile = usersInfo.find(u => u._id.toString() === uid);
        
        return {
            userId: uid,
            username: userProfile ? userProfile.username : "Unknown User",
            avatarUrl: userProfile ? userProfile.avatarUrl : null,
            email: userProfile ? userProfile.email : "",
            passedCount: rawItem.get('passed_count') // Số bài quiz đã hoàn thành
        };
    });

    return res.status(200).json(formatted);

  } catch (error) {
    console.error("Top User Quiz Error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 4. Quiz Completion Rate (Biểu đồ tròn)
export const getCompletionRate = async (req, res) => {
  try {
    // 1. Lấy tổng số Quiz hiện có
    const totalQuizzesCount = await Quiz.count();

    // 2. Lấy danh sách tất cả user
    const users = await User.find({ role: "user" }).select("_id");

    let notStarted = 0;
    let inProgress = 0;
    let completed = 0;

    // 3. Tính toán cho từng user (Có thể tối ưu hơn bằng Query gộp, nhưng logic này dễ hiểu hơn)
    for (const user of users) {
      // Đếm số quiz đã pass của user này
      const passedCount = await QuizResult.count({
        where: {
          mongoUserId: user._id.toString(),
          passed: 1
        },
        distinct: true,
        col: 'quiz_id' // Đếm số quiz_id khác nhau
      });

      if (passedCount === 0) {
        notStarted++;
      } else if (passedCount >= totalQuizzesCount) {
        completed++;
      } else {
        inProgress++;
      }
    }

    const total = users.length;

    return res.status(200).json({
      notStarted: Number(((notStarted / total) * 100).toFixed(1)),
      inProgress: Number(((inProgress / total) * 100).toFixed(1)),
      completed: Number(((completed / total) * 100).toFixed(1)),
      detail: { notStarted, inProgress, completed, total }
    });


  } catch (error) {
    console.error("Completion Rate Error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 5. Daily Traffic (Lượng truy cập - Dựa trên Session Mongo)
export const getDailyTraffic = async (req, res) => {
  try {
    // Lấy dữ liệu 7 ngày gần nhất
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const traffic = await Session.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } } // Sắp xếp theo ngày tăng dần
    ]);

    return res.status(200).json(traffic);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
}
export const updateAppVersion = async (req, res) => {
  try {
    const { version } = req.body; // Ví dụ: "1.0.4"

    if (!version) return res.status(400).json({ message: "Thiếu thông tin version" });

    const updatedConfig = await AppConfig.findOneAndUpdate(
      { key: "android_version" },
      { value: version },
      { new: true, upsert: true } // Cập nhật hoặc tạo mới
    );

    return res.status(200).json({
      message: "Cập nhật version thành công",
      newVersion: updatedConfig.value
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
}