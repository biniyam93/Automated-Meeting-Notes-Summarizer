from flask import Flask, render_template, request, jsonify
import requests
import os
from dotenv import load_dotenv
import time
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)

# Configuration
ASSEMBLYAI_KEY = os.getenv("ASSEMBLYAI_KEY")
GEMINI_API_KEY = "AIzaSyAZ80XoIvb_4u-Og4My0couhq4aQWCSiOg"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'm4a'}

# Initialize Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-pro-latest")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def summarize_with_gemini(text):
    prompt = (
        "You are a professional assistant. Summarize the following meeting transcript in clean, well-structured English. "
        "Do not use any markdown formatting, bullet points, or special characters. "
        "Make the summary concise and accurate. Keep only important names, dates, and decisions. Avoid asterisks or symbols.\n\n"
        f"Transcript:\n{text}"
    )
    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "max_output_tokens": 1000,
                "top_p": 1.0,
                "top_k": 40
            }
        )
        return response.text.strip()
    except Exception as e:
        return f"Summary failed: {str(e)}"

@app.route("/")
def home():
    return render_template("index.html", max_file_size=MAX_FILE_SIZE)

@app.route("/upload_audio", methods=["POST"])
def upload_audio():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    if file_size > MAX_FILE_SIZE:
        return jsonify({"error": f"File too large (max {MAX_FILE_SIZE // 1024 // 1024}MB)"}), 400

    try:
        # Upload audio to AssemblyAI
        headers = {'authorization': ASSEMBLYAI_KEY}
        upload_response = requests.post(
            'https://api.assemblyai.com/v2/upload',
            headers=headers,
            data=file.read(),
            timeout=30
        )

        if upload_response.status_code != 200:
            return jsonify({"error": "Upload failed"}), 500

        audio_url = upload_response.json()['upload_url']

        # Request transcription
        transcript_response = requests.post(
            'https://api.assemblyai.com/v2/transcript',
            json={'audio_url': audio_url},
            headers=headers,
            timeout=30
        )

        if transcript_response.status_code != 200:
            return jsonify({"error": "Transcription failed"}), 500

        transcript_id = transcript_response.json()['id']

        # Polling until transcription is complete
        start_time = time.time()
        timeout_duration = 300

        while True:
            if time.time() - start_time > timeout_duration:
                return jsonify({"error": "Transcription timeout"}), 500

            transcript = requests.get(
                f'https://api.assemblyai.com/v2/transcript/{transcript_id}',
                headers=headers,
                timeout=30
            ).json()

            if transcript['status'] == 'completed':
                transcript_text = transcript['text']
                break
            elif transcript['status'] == 'error':
                return jsonify({"error": "Transcription error"}), 500

            time.sleep(5)

        # Summarize
        summary = summarize_with_gemini(transcript_text)

        return jsonify({
            "success": True,
            "transcript": transcript_text,
            "summary": summary
        })

    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(port=5050, debug=True)
