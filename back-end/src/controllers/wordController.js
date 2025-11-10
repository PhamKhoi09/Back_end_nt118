
import {
  Word,
  Definition,
  POS,
  Example,
  Pronunciation,
  Synonym_Groups, // 👈 Khớp với index.js
  Word_Families   // 👈 Khớp với index.js
} from "../models/index.js"; // 👈 Sửa đường dẫn nếu cần

/**
 * API 3: Lấy chi tiết đầy đủ của 1 từ (Cả 3 tab)
 */
export const getWordDetails = async (req, res) => {
  try {
    const wordId = parseInt(req.params.id, 10);
    const mongoUserId = req.user._id.toString();

    // === 1. THỰC HIỆN "MEGA QUERY" (Đã sửa lỗi) ===
    const word = await Word.findByPk(wordId, {
      attributes: ['word_id', 'word_text'],
      include: [
        { 
          model: Pronunciation,
          attributes: ['region', 'phonetic_spelling', 'audio_file_url']
        },
        { 
          model: Definition,
          attributes: ['definition_id', 'definition_text', 'translation_text', 'pos_id'],
          include: [
            { model: POS, attributes: ['pos_name', 'pos_name_vie'] },
            { model: Example, attributes: ['example_sentence', 'translation_sentence'] }
          ]
        },
        { 
          // Tab Synonyms
          model: Synonym_Groups, // 👈 Dùng 'model' (khớp index.js)
          through: { attributes: [] },
          include: [{ model: Word, attributes: ['word_id', 'word_text'] }]
        },
        { 
          // Tab Antonyms (Chiều 1)
          // ❗️ SỬA: Dùng 'association' và alias CHÍNH XÁC (l-thường)
          association: 'Antonymlist', 
          attributes: ['word_id', 'word_text'],
          through: { attributes: [] }
        },
        {
          // Tab Antonyms (Chiều 2)
          // ❗️ SỬA: Dùng 'association' và alias CHÍNH XÁC
          association: 'AntonymOf',
          attributes: ['word_id', 'word_text'],
          through: { attributes: [] }
        },
        { 
          // Tab Word's Forms
          model: Word_Families, // 👈 Dùng 'model' (khớp index.js)
          through: { attributes: [] },
          include: [
            { 
              model: Word,
              attributes: ['word_id', 'word_text'],
              include: [
                { 
                  model: Definition,
                  attributes: ['pos_id'],
                  include: [{ model: POS, attributes: ['pos_name'] }]
                }
              ]
            }
          ]
        }
      ]
    });
    console.log(JSON.stringify(word, null, 2));
    if (!word) {
      return res.status(404).json({ message: "Không tìm thấy từ vựng." });
    }

   
    // === 3. XỬ LÝ LOGIC "CÁCH B" (Giữ nguyên) ===
    const wordForms = { noun: [], verb: [], adjective: [], adverb: [] };
    const addedWordForms = new Set(); 
    
    // ❗️ SỬA: Dùng tên model 'Word_Families' (khớp index.js)
    if (word.Word_Families) { 
      for (const family of word.Word_Families) {
        // 'Words' ở đây là accessor (hàm) do Sequelize tạo, nó ĐÚNG
        for (const familyWord of family.Words) { 
          if (familyWord.Definitions) {
            for (const def of familyWord.Definitions) {
              if (def.PO) {
                const posName = def.PO.pos_name;
                const wordText = familyWord.word_text;
                const key = `${posName}:${wordText}`;
                if (wordForms.hasOwnProperty(posName) && !addedWordForms.has(key)) {
                  wordForms[posName].push({ word_text: wordText });
                  addedWordForms.add(key);
                }
              }
            }
          }
        }
      }
    }

    // === 4. XỬ LÝ SYNONYMS/ANTONYMS ===
    // Synonyms (Giữ nguyên)
    const synonyms = [];
    const addedSynonyms = new Set();
    addedSynonyms.add(word.word_text); 
    // ❗️ SỬA: Dùng tên model 'Synonym_Groups' (khớp index.js)
    if (word.Synonym_Groups) {
      for (const group of word.Synonym_Groups) {
        for (const synWord of group.Words) {
          if (!addedSynonyms.has(synWord.word_text)) {
            synonyms.push({ word_id: synWord.word_id, word_text: synWord.word_text });
            addedSynonyms.add(synWord.word_text);
          }
        }
      }
    }
    
    // ❗️ SỬA: Gộp cả 2 chiều Antonyms
    const antonyms = [];
    const addedAntonyms = new Set();
    // Dùng 'Antonymlist' (l-thường)
    if (word.Antonymlist) { 
      word.Antonymlist.forEach(w => {
        if (!addedAntonyms.has(w.word_id)) {
          antonyms.push({ word_id: w.word_id, word_text: w.word_text });
          addedAntonyms.add(w.word_id);
        }
      });
    }
    // Dùng 'AntonymOf'
    if (word.AntonymOf) {
      word.AntonymOf.forEach(w => {
        if (!addedAntonyms.has(w.word_id)) {
          antonyms.push({ word_id: w.word_id, word_text: w.word_text });
          addedAntonyms.add(w.word_id);
        }
      });
    }

    // === 5. TỔNG HỢP KẾT QUẢ (Giữ nguyên) ===
    const result = {
      word_id: word.word_id,
      word_text: word.word_text,
    
      Pronunciations: word.Pronunciations,
      Definitions: word.Definitions,
      WordForms: wordForms,
      Synonyms: synonyms,
      Antonyms: antonyms
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error("Lỗi khi lấy getWordDetails:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
