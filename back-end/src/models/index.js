// models/mysql/index.js (ví dụ)
import Word from './Words.js';
import Definition from './Definition.js';
import POS from './POS.js';
import Example from './Example.js';
import Topics from './Topics.js';
import Pronunciation from './Pronunciation.js';
import Word_Families from './Word_Families.js'; 
import Synonym_Groups from './Synonym_Groups.js';
import Quiz from './Quiz.js';
import Question from './Question.js';
import QuestionOption from './QuestionOption.js';
import MatchingPair from './MatchingPair.js';
import QuizResult from './QuizResult.js';
// --- Quan hệ 1 - Nhiều (One-to-Many) ---

// 1. Một 'Word' có nhiều 'Definition'
Word.hasMany(Definition, { foreignKey: 'word_id' });
// Một 'Definition' thuộc về một 'Word'
Definition.belongsTo(Word, { foreignKey: 'word_id' });

// 2. Một 'POS' có nhiều 'Definition'
POS.hasMany(Definition, { foreignKey: 'pos_id' });
// Một 'Definition' thuộc về một 'POS'
Definition.belongsTo(POS, { foreignKey: 'pos_id' });

// 3. Một 'Definition' có nhiều 'Example'
Definition.hasMany(Example, { foreignKey: 'definition_id' });
// Một 'Example' thuộc về một 'Definition'
Example.belongsTo(Definition, { foreignKey: 'definition_id' });
// 1. Một 'Word' có nhiều 'Pronunciation'
Word.hasMany(Pronunciation, { foreignKey: 'word_id' });
// Một 'Pronunciation' thuộc về một 'Word'
Pronunciation.belongsTo(Word, { foreignKey: 'word_id' });

// 2. Một 'Definition' có nhiều 'Example'
Definition.hasMany(Example, { foreignKey: 'definition_id' });
// Một 'Example' thuộc về một 'Definition'
Example.belongsTo(Definition, { foreignKey: 'definition_id' });

// 1. Topic <-> Quiz (1-1)
Topics.hasOne(Quiz, { foreignKey: 'topic_id' });
Quiz.belongsTo(Topics, { foreignKey: 'topic_id' });

// 2. Quiz <-> Question (1-Nhiều)
Quiz.hasMany(Question, { foreignKey: 'quiz_id' });
Question.belongsTo(Quiz, { foreignKey: 'quiz_id' });

// 3. Question <-> QuestionOption (1-Nhiều)
Question.hasMany(QuestionOption, { foreignKey: 'question_id' });
QuestionOption.belongsTo(Question, { foreignKey: 'question_id' });

// 4. Question <-> MatchingPair (1-Nhiều)
Question.hasMany(MatchingPair, { foreignKey: 'question_id' });
MatchingPair.belongsTo(Question, { foreignKey: 'question_id' });

// 5. Quiz <-> QuizResult (1-Nhiều)
Quiz.hasMany(QuizResult, { foreignKey: 'quiz_id' });
QuizResult.belongsTo(Quiz, { foreignKey: 'quiz_id' });
// --- Quan hệ Nhiều - Nhiều (Many-to-Many) ---

// 4. 'Word' và 'Topic' (qua bảng 'Word_Topic_Mapping')
Word.belongsToMany(Topics, {
  through: 'Word_Topic_Mapping', 
  timestamps: false,// 👈 Tên bảng trung gian
  foreignKey: 'word_id'         // Khóa của Word trong bảng trung gian
});
Topics.belongsToMany(Word, {
  through: 'Word_Topic_Mapping',
  timestamps: false,
  foreignKey: 'topic_id'         // Khóa của Topic trong bảng trung gian
});

// 2. Word <-> WordFamily (Nhiều-Nhiều)
Word.belongsToMany(Word_Families, {
  through: 'Word_Family_Mapping', 
  timestamps: false,
  foreignKey: 'word_id'
});
Word_Families.belongsToMany(Word, {
  through: 'Word_Family_Mapping',
  timestamps: false,
  foreignKey: 'family_id'
});


// 3. Word <-> SynonymGroup (Nhiều-Nhiều)
Word.belongsToMany(Synonym_Groups, {
  through: 'Word_Synonym_Mapping',
  timestamps: false, // 👈 Tên bảng trung gian
  foreignKey: 'word_id'
});
Synonym_Groups.belongsToMany(Word, {
  through: 'Word_Synonym_Mapping',
  foreignKey: 'group_id',
  timestamps: false
});


// 4. Word <-> Word (Nhiều-Nhiều, Tự tham chiếu) cho Antonyms (Từ trái nghĩa)
// Đây là trường hợp đặc biệt: một bảng tự liên kết với chính nó

Word.belongsToMany(Word, {
  as: 'Antonymlist', // 👈 Đặt tên định danh cho quan hệ này
  through: 'Antonyms', // 👈 Tên bảng trung gian
  foreignKey: 'word1_id', // Cột 1
  timestamps: false,
  otherKey: 'word2_id'   // Cột 2
});

// Để quan hệ này hoạt động 2 chiều (word2 cũng tìm được word1)
Word.belongsToMany(Word, {
  as: 'AntonymOf', // 👈 Tên định danh ngược lại
  through: 'Antonyms',
  foreignKey: 'word2_id',
  timestamps: false,
  otherKey: 'word1_id'
});
// Bạn làm tương tự cho các bảng mapping khác...
export {
  Word,
  Topics,
  Word_Families,
  Synonym_Groups,
  Example,
  Definition,
  POS,
  Pronunciation,
  Quiz,
  Question,
  QuestionOption,
  MatchingPair,
  QuizResult
  // ... (xuất các model khác)
};