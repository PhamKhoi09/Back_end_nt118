import os
import uuid
import numpy as np
import librosa
import requests
import whisper
from scipy.spatial.distance import euclidean
from fastdtw import fastdtw
from flask import Flask, request, jsonify
from difflib import SequenceMatcher

app = Flask(_name_)

# 1. Load AI Model (Whisper)
print("⏳ Loading Whisper...")
model = whisper.load_model("base")
print("✅ Whisper Ready!")

# =======================
# MODULE 1: XỬ LÝ CAO ĐỘ (NON-AI / DSP)
# =======================
def extract_pitch_contour(y, sr):
    # Sử dụng thuật toán YIN để trích xuất cao độ (F0)
    # fmin=50Hz, fmax=400Hz (Vùng giọng nói con người)
    f0, voiced_flag, _ = librosa.pyin(y, fmin=50, fmax=400, sr=sr)
    
    # Thay thế các giá trị NaN (không có tiếng) bằng 0
    f0 = np.nan_to_num(f0)
    
    # Chỉ lấy những đoạn có tiếng (Voiced) để so sánh
    # Vì đoạn im lặng cao độ = 0 so sánh sẽ không chính xác
    return f0[f0 > 0]

def compare_intonation(user_path, ref_path):
    try:
        y1, sr1 = librosa.load(user_path, sr=16000)
        y2, sr2 = librosa.load(ref_path, sr=16000)

        # Trích xuất đường cao độ (Pitch)
        pitch1 = extract_pitch_contour(y1, sr1)
        pitch2 = extract_pitch_contour(y2, sr1)

        if len(pitch1) < 10 or len(pitch2) < 10:
            return 0.0 # Không bắt được giọng

        # --- CHUẨN HÓA CAO ĐỘ (QUAN TRỌNG) ---
        # Vì giọng Nam trầm hơn giọng Nữ. Ta không so sánh Hz tuyệt đối.
        # Ta so sánh "Hình dáng" (Shape) của đường cao độ (Z-score normalization)
        pitch1_norm = (pitch1 - np.mean(pitch1)) / (np.std(pitch1) + 1e-8)
        pitch2_norm = (pitch2 - np.mean(pitch2)) / (np.std(pitch2) + 1e-8)

        # Dùng DTW để so sánh hình dáng 2 đường cao độ
        distance, path = fastdtw(pitch1_norm.reshape(-1, 1), pitch2_norm.reshape(-1, 1), dist=euclidean)
        avg_dist = distance / len(path)

        # Chấm điểm Intonation
        # Dist < 0.5 là rất giống, > 1.5 là ngược tông
        score = 100 / (0.7 + np.exp(3 * (avg_dist - 0.7)))
        
        return round(score, 1)

    except Exception as e:
        print(f"⚠️ Lỗi Pitch: {e}")
        return 50.0 # Trả điểm trung bình nếu lỗi DSP

# =======================
# MODULE 2: XỬ LÝ VĂN BẢN (AI)
# =======================
def normalize_text(text):
    return "".join(c for c in text if c.isalnum()).lower()

# =======================
# MAIN API
# =======================
@app.route('/grade', methods=['POST'])
def grade():
    user_filename = None
    ref_filename = None

    try:
        # Nhận dữ liệu
        user_file = request.files['user_audio']
        ref_url = request.form['ref_audio_url'] # URL file audio mẫu (để so sánh Pitch)
        correct_word = request.form['correct_word'] # Từ vựng đúng (để so sánh Text)

        random_id = str(uuid.uuid4())[:8]
        user_filename = f"user_{random_id}.wav"
        ref_filename = f"ref_{random_id}.mp3"
        
        user_file.save(user_filename)

        # Tải file mẫu về để phân tích cao độ
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(ref_url, headers=headers, timeout=10)
        with open(ref_filename, "wb") as f:
            f.write(response.content)

        # --- BƯỚC 1: CHẤM ĐỘ CHÍNH XÁC (WHISPER AI) ---
        print("🤖 AI đang nghe...")
        ai_result = model.transcribe(user_filename, language="en", fp16=False)
        detected_text = ai_result["text"]
        
        # So sánh text
        text_similarity = SequenceMatcher(None, normalize_text(correct_word), normalize_text(detected_text)).ratio()
        accuracy_score = text_similarity * 100
        
        print(f"🎯 Text: {accuracy_score}% (Target: {correct_word} | User: {detected_text})")

        # --- LOGIC QUYẾT ĐỊNH ---
        final_score = 0
        intonation_score = 0
        feedback = ""

        if accuracy_score < 60:
            # Nếu đọc sai từ -> 0 điểm luôn, không cần chấm ngữ điệu
            final_score = accuracy_score
            feedback = f"Bạn phát âm chưa đúng từ này. AI nghe thành: '{detected_text}'"
        else:
            # Nếu đọc đúng từ -> Chấm thêm ngữ điệu (DSP)
            print("🎼 Đang phân tích ngữ điệu (DSP)...")
            intonation_score = compare_intonation(user_filename, ref_filename)
            print(f"🎯 Intonation: {intonation_score}%")

            # Công thức tổng hợp: 60% Độ đúng từ + 40% Ngữ điệu
            final_score = (accuracy_score * 0.7) + (intonation_score * 0.3)

        return jsonify({
            "score": round(final_score, 1),
            "details": {
                "accuracy_score": round(accuracy_score, 1),
                "intonation_score": round(intonation_score, 1),
                "detected_text": detected_text
            },
        })

    except Exception as e:
        print(f"🔥 Error: {e}")
        return jsonify({"error": str(e)}), 500

    finally:
        for f in [user_filename, ref_filename]:
            if f and os.path.exists(f):
                try: os.remove(f)
                except: pass

if _name_ == '_main_':
    app.run(port=5002, debug=True)