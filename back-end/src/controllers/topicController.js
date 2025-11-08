// controllers/topicController.js
import Topic from "../models/Topics.js";
import UserTopicProgress from "../models/UserTopicProgress.js";
//import { Word } from "../models/index.js"; // Giả sử bạn có file index

export const getAllTopicsForUser = async (req, res) => {
  try {
    const mongoUserId = req.user._id.toString(); // Lấy từ authMiddleware

    // 1. Lấy TẤT CẢ chủ đề
    const allTopics = await Topic.findAll({
      attributes: ['topic_id', 'topic_name', 'difficulty'], // Thêm 'difficulty'
      order: [['topic_id', 'ASC']], // Đảm bảo đúng thứ tự
    });

    // 2. Lấy TIẾN ĐỘ của user
    const userProgress = await UserTopicProgress.findAll({
      where: { mongoUserId: mongoUserId },
      attributes: ['topic_id', 'status']
    });

   // 3. Xử lý logic Mở khóa Mặc định (cho user mới)
    // Nếu user chưa có tiến độ nào, mở khóa topic đầu tiên
    if (userProgress.length === 0 && allTopics.length > 0) {
      const firstTopicId = allTopics[0].topic_id;
      // Tạo bản ghi mới
      const newProgress = await UserTopicProgress.create({
        mongoUserId: mongoUserId,
        topic_id: firstTopicId,
        status: 'unlocked'
      });
      // Thêm vào mảng progress
      userProgress.push(newProgress);
    }
    
    // 4. "Trộn" (map) 2 mảng lại với nhau
    const progressMap = new Map(
      userProgress.map(p => [p.topic_id, p.status])
    );

    const result = allTopics.map(topic => {
      const status = progressMap.get(topic.topic_id) || 'locked'; // Mặc định là 'locked'
      return {
        topic_id: topic.topic_id,
        topic_name: topic.topic_name,
        difficulty: topic.difficulty, // Trả về 'Easy'
        status: status // 'locked', 'unlocked', 'completed'
      };
    });

    // (Tùy chọn) Đếm số từ cho mỗi chủ đề (có thể làm sau, hơi nặng)

    return res.status(200).json(result);

  } catch (error) {
    console.error("Lỗi khi lấy chủ đề:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

import { Word, Definition, POS, Example, Pronunciation } from "../models/index.js";

export const getFlashcardsForTopic = async (req, res) => {
  try {
    const mongoUserId = req.user._id.toString();
    const topicId = parseInt(req.params.id, 10);

    // 1. KIỂM TRA QUYỀN: User này có được học chủ đề này không?
    const access = await UserTopicProgress.findOne({
      where: {
        mongoUserId: mongoUserId,
        topic_id: topicId,
        status: ['unlocked', 'completed'] // Phải là unlocked hoặc completed
      }
    });

    if (!access) {
      return res.status(403).json({ message: "Bạn phải mở khóa chủ đề này trước." });
    }

    // 2. LẤY DỮ LIỆU: Dùng câu truy vấn lồng nhau (nested include)
    const topicWithWords = await Topic.findByPk(topicId, {
      attributes: [], // Không cần thông tin topic
      include: [
        {
          model: Word,
          attributes: ['word_id', 'word_text'],
          through: { attributes: [] }, // Tắt bảng "mapping"
          include: [
            {
              model: Pronunciation, // Lấy phiên âm
              attributes: ['phonetic_spelling', 'audio_file_url', 'region']
            },
            {
              model: Definition, // Lấy định nghĩa
              attributes: ['definition_text', 'translation_text'],
              include: [
                { model: POS, attributes: ['pos_name'] }, // Lấy loại từ
                { 
                  model: Example, // Lấy ví dụ
                  attributes: ['example_sentence', 'translation_sentence']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!topicWithWords) {
      return res.status(404).json({ message: "Không tìm thấy chủ đề." });
    }

    // 3. Trả về mảng các từ (flashcards)
    return res.status(200).json(topicWithWords.Words); // Trả về mảng Words

  } catch (error) {
    console.error("Lỗi khi lấy flashcards:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};