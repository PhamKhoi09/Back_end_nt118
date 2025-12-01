// controllers/adminQuizController.js
import { 
  Quiz, 
  Question, 
  QuestionOption, 
  MatchingPair, 
  Topics, 
  QuizResult 
} from "../models/index.js"; // Import từ file index.js chứa mối quan hệ
import sequelize from "../libs/posgre.js";

// --- QUẢN LÝ QUIZ ---

// 1. Lấy danh sách Quiz (Kèm thống kê cho bảng Dashboard)
export const getAllQuizzes = async (req, res) => {
  try {
    // Phân trang
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Lấy danh sách Quiz cơ bản
    const { count, rows: quizzes } = await Quiz.findAndCountAll({
      limit,
      offset,
      include: [
        { model: Topics, attributes: ['topic_name'] } // Lấy tên Topic
      ],
      order: [['quiz_id', 'DESC']]
    });

    // Tính toán thống kê chi tiết cho từng Quiz (Số câu hỏi, Điểm TB, Số người thi)
    // Dùng Promise.all để xử lý song song giúp api nhanh hơn
    const data = await Promise.all(quizzes.map(async (quiz) => {
      const quizId = quiz.quiz_id;

      // Đếm số câu hỏi
      const questionCount = await Question.count({ where: { quiz_id: quizId } });

      // Tính điểm trung bình và số người tham gia từ bảng Result
      const stats = await QuizResult.findOne({
        where: { quiz_id: quizId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('score')), 'avgGrade'], // Tính trung bình cộng
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('mongoUserId'))), 'userJoined'] // Đếm user không trùng lặp
        ],
        raw: true
      });

      return {
        quiz_id: quiz.quiz_id,
        title: quiz.title,
        topic_name: quiz.Topic ? quiz.Topic.topic_name : 'Unknown',
        passing_score: quiz.passing_score,
        duration_minutes: quiz.duration_minutes,
        questionCount: questionCount,
        avgGrade: stats.avgGrade ? parseFloat(stats.avgGrade).toFixed(1) + '%' : '0%',
        userJoined: stats.userJoined || 0
      };
    }));

    return res.status(200).json({
      data,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error("Lỗi getAllQuizzes:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 2. Lấy chi tiết 1 Quiz (Kèm toàn bộ câu hỏi và đáp án để Edit)
export const getQuizDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findByPk(id, {
      include: [
        { 
          model: Question, 
          include: [
            { model: QuestionOption }, // Lấy options trắc nghiệm
            { model: MatchingPair }    // Lấy cặp thẻ nối từ
          ]
        }
      ],
      order: [
        [Question, 'question_id', 'ASC'] // Sắp xếp câu hỏi theo thứ tự tạo
      ]
    });

    if (!quiz) return res.status(404).json({ message: "Không tìm thấy Quiz" });

    return res.status(200).json(quiz);
  } catch (error) {
    console.error("Lỗi getQuizDetail:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 3. Tạo Quiz mới
export const createQuiz = async (req, res) => {
  try {
    const { quiz_id, title, topic_id, passing_score, duration_minutes } = req.body;
    
    const newQuiz = await Quiz.create({
      quiz_id,
      title,
      topic_id,
      passing_score,
      duration_minutes
    });

    return res.status(201).json(newQuiz);
  } catch (error) {
    console.error("Lỗi createQuiz:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 4. Update Quiz (Chỉ sửa thông tin chung, không sửa câu hỏi)
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, topic_id, passing_score, duration_minutes } = req.body;

    const quiz = await Quiz.findByPk(id);
    if (!quiz) return res.status(404).json({ message: "Quiz không tồn tại" });

    await quiz.update({ title, topic_id, passing_score, duration_minutes });

    return res.status(200).json({ message: "Cập nhật thành công", quiz });
  } catch (error) {
    console.error("Lỗi updateQuiz:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 5. Xóa Quiz (Cẩn thận: Cần xóa câu hỏi liên quan nếu DB không set CASCADE)
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Nếu bạn đã set onDelete: 'CASCADE' trong database thì chỉ cần xóa Quiz là đủ
    // Nếu chưa, code an toàn sẽ là: tìm Questions -> Xóa Options/Pairs -> Xóa Questions -> Xóa Quiz
    
    // Ở đây tôi giả định xóa Quiz sẽ xóa các bảng con (do config DB) hoặc xóa mềm
    const deleted = await Quiz.destroy({ where: { quiz_id: id } });

    if (!deleted) return res.status(404).json({ message: "Quiz không tồn tại" });

    return res.status(200).json({ message: "Đã xóa Quiz thành công" });
  } catch (error) {
    console.error("Lỗi deleteQuiz:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// --- QUẢN LÝ CÂU HỎI (QUESTIONS) ---

// 6. Tạo câu hỏi mới (Xử lý đa hình: Trắc nghiệm hoặc Nối từ)
export const createQuestion = async (req, res) => {
  try {
    const { 
      quiz_id, 
      question_id,
      question_type, 
      prompt, 
      image_url, 
      audio_url, 
      correct_text_answer,
      options, // Array các lựa chọn (nếu là trắc nghiệm)
      pairs    // Array các cặp (nếu là match pairs)
    } = req.body;

    // 1. Tạo Question cha
    const newQuestion = await Question.create({
      quiz_id,
      question_id,
      question_type,
      prompt,
      image_url,
      audio_url,
      correct_text_answer
    });

    // 2. Tạo dữ liệu con dựa vào loại câu hỏi
    if (question_type === 'MATCH_PAIRS' && pairs && pairs.length > 0) {
      // Lưu vào bảng MatchingPair
      const pairsData = pairs.map(p => ({
        question_id: newQuestion.question_id,
        pair_id: p.pair_id,
        image_url: p.image_url,
        word_text: p.word_text
      }));
      await MatchingPair.bulkCreate(pairsData);

    } else if (options && options.length > 0) {
      // Lưu vào bảng QuestionOption (cho LISTEN_CHOOSE_IMG, IMG_CHOOSE_TEXT...)
      const optionsData = options.map(opt => ({
        question_id: newQuestion.question_id,
        option_id: opt.option_id,
        option_text: opt.option_text,
        option_image_url: opt.option_image_url,
        is_correct: opt.is_correct ? 1 : 0
      }));
      await QuestionOption.bulkCreate(optionsData);
    }

    return res.status(201).json({ message: "Tạo câu hỏi thành công", question: newQuestion });

  } catch (error) {
    console.error("Lỗi createQuestion:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 7. Sửa câu hỏi (Chiến thuật: Update info câu hỏi + Xóa hết Options cũ tạo lại Options mới)
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params; // question_id
    const { 
      prompt, image_url, audio_url, correct_text_answer, question_type,
      options, pairs 
    } = req.body;

    const question = await Question.findByPk(id);
    if (!question) return res.status(404).json({ message: "Câu hỏi không tồn tại" });

    // 1. Update thông tin cơ bản của Question
    await question.update({
      prompt, image_url, audio_url, correct_text_answer, question_type
    });

    // 2. Cập nhật Options/Pairs (Cách an toàn nhất: Xóa cũ -> Tạo mới)
    
    // Xóa dữ liệu cũ
    await QuestionOption.destroy({ where: { question_id: id } });
    await MatchingPair.destroy({ where: { question_id: id } });

    // Tạo dữ liệu mới
    if (question_type === 'MATCH_PAIRS' && pairs && pairs.length > 0) {
      const pairsData = pairs.map(p => ({
        question_id: id,
        image_url: p.image_url,
        word_text: p.word_text
      }));
      await MatchingPair.bulkCreate(pairsData);
    } else if (options && options.length > 0) {
      const optionsData = options.map(opt => ({
        question_id: id,
        option_text: opt.option_text,
        option_image_url: opt.option_image_url,
        is_correct: opt.is_correct ? 1 : 0
      }));
      await QuestionOption.bulkCreate(optionsData);
    }

    return res.status(200).json({ message: "Cập nhật câu hỏi thành công" });

  } catch (error) {
    console.error("Lỗi updateQuestion:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 8. Xóa câu hỏi
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Xóa question (Các options/pairs sẽ tự mất nếu có cascade, hoặc nên xóa thủ công để sạch DB)
    await QuestionOption.destroy({ where: { question_id: id } });
    await MatchingPair.destroy({ where: { question_id: id } });
    
    const deleted = await Question.destroy({ where: { question_id: id } });

    if (!deleted) return res.status(404).json({ message: "Câu hỏi không tồn tại" });

    return res.status(200).json({ message: "Đã xóa câu hỏi" });
  } catch (error) {
    console.error("Lỗi deleteQuestion:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};