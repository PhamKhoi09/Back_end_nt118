import {
  Quiz,
  Question,
  QuestionOption,
  MatchingPair,
  Topics,
  QuizResult
} from "../models/index.js";
import UserTopicProgress from "../models/UserTopicProgress.js";
import { Op } from "sequelize";
/**
 * API: Lấy đề thi cho một Topic
 * GET /api/topics/:id/quiz
 */
export const getQuizByTopicId = async (req, res) => {
  try {
    const topicId = parseInt(req.params.id, 10);
    const mongoUserId = req.user._id.toString();

    // 1. KIỂM TRA QUYỀN (Unlock Logic)
    // User phải mở khóa topic này (unlocked) hoặc đã hoàn thành (completed) mới được làm quiz
    const access = await UserTopicProgress.findOne({
      where: {
        mongoUserId: mongoUserId,
        topic_id: topicId,
        status: ['unlocked', 'comppleted']
      }
    });

    if (!access) {
      return res.status(403).json({ message: "Bạn chưa mở khóa bài kiểm tra này." });
    }

    // 2. LẤY DỮ LIỆU QUIZ (Kèm Câu hỏi & Đáp án)
    const quiz = await Quiz.findOne({
      where: { topic_id: topicId },
      attributes: ['quiz_id', 'title', 'passing_score', 'duration_minutes'], // Lấy các trường cần thiết
      include: [
        {
          model: Question,
          attributes: ['question_id', 'question_type', 'prompt', 'image_url', 'audio_url'], 
          // Lưu ý: KHÔNG lấy 'correct_text_answer' (cho dạng điền từ) để bảo mật
          
          include: [
            {
              // Lấy lựa chọn trắc nghiệm (Dạng 1, 2, 3)
              model: QuestionOption,
              // ❗️ QUAN TRỌNG: Loại bỏ 'is_correct' để user không thấy đáp án
              attributes: ['option_id', 'option_text', 'option_image_url'] 
            },
            {
              // Lấy cặp nối (Dạng 4)
              model: MatchingPair,
              attributes: ['pair_id', 'image_url', 'word_text']
              // Với dạng nối, client sẽ nhận cả cặp và tự xáo trộn (shuffle) để hiển thị
            }
          ]
        }
      ]
    });

    if (!quiz) {
      return res.status(404).json({ message: "Chưa có bài kiểm tra cho chủ đề này." });
    }

    return res.status(200).json(quiz);

  } catch (error) {
    console.error("Lỗi khi lấy Quiz:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};


// ======================================================
// ❗️ API 2: NỘP BÀI (LOGIC CHẤM ĐIỂM TRỌNG SỐ MỚI) ❗️
// ======================================================

export const submitQuiz = async (req, res) => {
  try {
    const topicId = parseInt(req.params.id, 10);
    const mongoUserId = req.user._id.toString();
    const { answers } = req.body; // Danh sách câu trả lời của user

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Dữ liệu bài làm không hợp lệ." });
    }

    // 1. LẤY THÔNG TIN QUIZ & ĐÁP ÁN TỪ CSDL
    const quiz = await Quiz.findOne({
      where: { topic_id: topicId },
      include: [
        {
          model: Question,
          include: [
            { model: QuestionOption }, // Lấy options để check trắc nghiệm
            { model: MatchingPair }    // Lấy pairs để check nối hình
          ]
        }
      ]
    });

    if (!quiz) {
      return res.status(404).json({ message: "Không tìm thấy bài kiểm tra." });
    }

    // 2. CHẤM ĐIỂM (WEIGHTED SCORING)
    let totalPossiblePoints = 0; // Tổng điểm tối đa có thể đạt được
    let userEarnedPoints = 0;    // Tổng điểm user thực tế đạt được
    
    // Tạo Map câu trả lời của user để tra cứu nhanh (Key: question_id)
    const userAnswersMap = new Map(answers.map(a => [a.question_id, a]));

    // Duyệt qua TẤT CẢ câu hỏi trong ĐỀ THI (DB)
    for (const dbQuestion of quiz.Questions) {
        
        const userAnswer = userAnswersMap.get(dbQuestion.question_id);
        
        // --- TRƯỜNG HỢP 1: CÂU HỎI NỐI (Dạng 4) ---
        // Trọng số điểm = số lượng cặp nối (thường là 4)
        if (dbQuestion.question_type === 'MATCH_PAIRS') {
            // Điểm tối đa cho câu này = Số lượng cặp trong DB
            const maxPointsForQuestion = dbQuestion.MatchingPairs.length; 
            totalPossiblePoints += maxPointsForQuestion;

            if (userAnswer && userAnswer.pairs && Array.isArray(userAnswer.pairs)) {
                let correctPairsCount = 0;
                // Duyệt qua từng cặp user gửi lên để chấm điểm
                for (const userPair of userAnswer.pairs) {
                    // Tìm xem cặp này có đúng với DB không
                    const isPairCorrect = dbQuestion.MatchingPairs.some(
                        dbPair => dbPair.image_url === userPair.image_url && dbPair.word_text === userPair.word_text
                    );
                    if (isPairCorrect) {
                        correctPairsCount++;
                    }
                }
                // Cộng điểm thực tế (mỗi cặp đúng = 1 điểm)
                userEarnedPoints += correctPairsCount;
            }
        } 
        
        // --- TRƯỜNG HỢP 2: CÁC CÂU HỎI KHÁC (Dạng 1, 2, 3) ---
        // Trọng số điểm = 1
        else {
            totalPossiblePoints += 1; // Mặc định 1 điểm
            let isCorrect = false;

            // Nếu user có trả lời
            if (userAnswer) {
                switch (dbQuestion.question_type) {
                    // Dạng 1 & 2: Chọn hình hoặc Chọn chữ (Trắc nghiệm)
                    case 'LISTEN_CHOOSE_IMG':
                    case 'IMG_CHOOSE_TEXT':
                        if (userAnswer.selected_option_id) {
                            const correctOption = dbQuestion.QuestionOptions.find(opt => opt.is_correct === 1);
                            // So sánh ID đáp án chọn với ID đáp án đúng
                            if (correctOption && correctOption.option_id === userAnswer.selected_option_id) {
                                isCorrect = true;
                            }
                        }
                        break;
                    
                    // Dạng 3: Điền từ
                    case 'FILL_BLANK':
                         if (userAnswer.text_input && dbQuestion.correct_text_answer) {
                             // So sánh chuỗi (không phân biệt hoa thường, bỏ khoảng trắng thừa)
                             if (userAnswer.text_input.trim().toLowerCase() === dbQuestion.correct_text_answer.trim().toLowerCase()) {
                                 isCorrect = true;
                             }
                         }
                         break;
                }
            }

            if (isCorrect) {
                userEarnedPoints += 1;
            }
        }
    }

    // 3. TÍNH TỔNG KẾT (QUY ĐỔI VỀ THANG 10 HOẶC 100)
    // Ở đây quy đổi về thang điểm gốc của Quiz (thường là 100) để so sánh với passing_score
    // Ví dụ: Tổng 10 điểm (2 câu thường + 1 câu nối 8 cặp), User được 5 điểm => 50%
    const scorePercentage = totalPossiblePoints > 0 
        ? Math.round((userEarnedPoints / totalPossiblePoints) * 100) 
        : 0;

    const passed = scorePercentage >= quiz.passing_score ? 1 : 0;

    // 4. LƯU KẾT QUẢ
    const resultRecord = await QuizResult.create({
      quiz_id: quiz.quiz_id,
      mongoUserId: mongoUserId,
      score: scorePercentage, // Lưu điểm quy đổi (0-100)
      passed: passed
    });

    // 5. LOGIC MỞ KHÓA (UNLOCK NEXT TOPIC)
    let isNextTopicUnlocked = false;

    if (passed === 1) {
      // A. Cập nhật topic hiện tại thành 'completed'
      await UserTopicProgress.update(
        { status: 'completed' },
        { where: { mongoUserId, topic_id: topicId } }
      );

      // B. Tìm Topic tiếp theo
      const nextTopic = await Topics.findOne({
        where: { topic_id: { [Op.gt]: topicId } },
        order: [['topic_id', 'ASC']]
      });

      if (nextTopic) {
        const [nextProgress, created] = await UserTopicProgress.findOrCreate({
          where: { mongoUserId, topic_id: nextTopic.topic_id },
          defaults: { status: 'unlocked' }
        });
        
        // Nếu mới tạo hoặc trước đó bị lock thì mở khóa
        if (created || nextProgress.status === 'locked') {
             if (nextProgress.status === 'locked') {
                 nextProgress.status = 'unlocked';
                 await nextProgress.save();
             }
             isNextTopicUnlocked = true;
        }
      }
    }

    // 6. TRẢ VỀ KẾT QUẢ CHI TIẾT
    return res.status(200).json({
      score: scorePercentage,       // Điểm quy đổi (0-100)
      passed: passed === 1,
      user_points: userEarnedPoints,         // Điểm thô user đạt được (ví dụ: 8)
      total_possible_points: totalPossiblePoints, // Tổng điểm thô tối đa (ví dụ: 10)
      is_next_topic_unlocked: isNextTopicUnlocked,
      submitted_at: resultRecord.createdAt
    });

  } catch (error) {
    console.error("Lỗi khi nộp bài Quiz:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

