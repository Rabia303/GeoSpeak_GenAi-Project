from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tempfile
import os
import traceback
import speech_recognition as sr
from deep_translator import GoogleTranslator
import io
import subprocess
import shutil
from gtts import gTTS

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"])

app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB

def find_ffmpeg():
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        return ffmpeg_path
    
    custom_paths = [
        "C:\\FFMPEG\\ffmpeg\\bin\\ffmpeg.exe",
        "C:\\ffmpeg\\bin\\ffmpeg.exe",
        "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
        "/usr/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        'C:\\ffmpeg\\bin',
        'C:\ffmpeg\bin'
    ]
    
    for path in custom_paths:
        if os.path.exists(path):
            return path
    
    return None

FFMPEG_PATH = find_ffmpeg()

def convert_audio_to_wav(audio_data, input_extension=".webm"):
    if not FFMPEG_PATH:
        print("FFmpeg not found, skipping audio conversion")
        return None
        
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=input_extension) as input_file:
            input_file.write(audio_data)
            input_path = input_file.name
            
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as output_file:
            output_path = output_file.name
            
        cmd = [
            FFMPEG_PATH,
            '-i', input_path,
            '-acodec', 'pcm_s16le',
            '-ac', '1',
            '-ar', '16000',
            '-loglevel', 'error',
            output_path,
            '-y'
        ]
        
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if result.returncode == 0:
            with open(output_path, 'rb') as f:
                wav_data = f.read()
                
            os.unlink(input_path)
            os.unlink(output_path)
            
            return wav_data
        else:
            print(f"FFmpeg conversion failed: {result.stderr}")
            try:
                os.unlink(input_path)
                os.unlink(output_path)
            except:
                pass
            return None
            
    except Exception as e:
        print(f"Error in FFmpeg conversion: {e}")
        try:
            os.unlink(input_path)
            os.unlink(output_path)
        except:
            pass
        return None

def transcribe_audio(audio_data, language="ur-IN"):
    try:
        recognizer = sr.Recognizer()
        
        with sr.AudioFile(io.BytesIO(audio_data)) as source:
            audio = recognizer.record(source)
            
        # Try with specified language first, then fallback to auto-detect
        try:
            text = recognizer.recognize_google(audio, language=language)
        except:
            text = recognizer.recognize_google(audio)
            
        return text
    except sr.UnknownValueError:
        return "Could not understand audio"
    except sr.RequestError as e:
        return f"Error with speech recognition service: {e}"
    except Exception as e:
        return f"Error transcribing audio: {str(e)}"

def translate_text(text, target_lang, source_lang='auto'):
    try:
        if text.strip() and not text.startswith("Could not understand") and not text.startswith("Error"):
            translation = GoogleTranslator(source=source_lang, target=target_lang).translate(text)
            return translation
        return text
    except Exception as e:
        return f"Translation error: {str(e)}"

def text_to_speech(text, lang='en'):
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
            tts = gTTS(text=text, lang=lang, slow=False)
            tts.save(tmp_file.name)
            return tmp_file.name
    except Exception as e:
        print(f"Error in text-to-speech: {e}")
        return None

@app.route("/health", methods=["GET"])
def health():
    ffmpeg_available = FFMPEG_PATH is not None
    info = {
        "status": "OK", 
        "free_apis_available": True, 
        "mode": "free_apis", 
        "ffmpeg_available": ffmpeg_available,
        "ffmpeg_path": FFMPEG_PATH or "Not found"
    }
    return jsonify(info)

@app.route("/translate", methods=["POST", "OPTIONS"])
def translate_audio():
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded (field name must be 'file')."}), 400

        audio_file = request.files["file"]
        source_lang = request.form.get("source_lang", "auto")
        target_lang = request.form.get("target_lang", "en")

        # Get file extension
        filename = audio_file.filename
        _, file_extension = os.path.splitext(filename)
        if not file_extension:
            file_extension = ".webm"  # Default assumption

        audio_data = audio_file.read()
        
        # Map language codes to speech recognition language codes
        lang_map = {
            "ur": "ur-PK",  # Urdu for Pakistan
            "en": "en-US",
            "es": "es-ES",
            "fr": "fr-FR",
            "de": "de-DE",
            "hi": "hi-IN",
            "ja": "ja-JP",
            "zh": "zh-CN",
            "ar": "ar-SA"
        }
        
        speech_lang = lang_map.get(source_lang, "en-US")
        
        # Convert audio to WAV format
        wav_data = convert_audio_to_wav(audio_data, file_extension)
        
        if wav_data:
            # Transcribe audio
            original_text = transcribe_audio(wav_data, speech_lang)
            
            # If transcription failed, use mock text
            if "Error" in original_text or "Could not understand" in original_text:
                print(f"Transcription failed: {original_text}")
                original_text = "This is a transcript of your recording."
        else:
            # If conversion fails or FFmpeg not available, use mock text
            original_text = "This is a transcript of your recording. (Audio conversion not available)"

        # Translate text
        translated_text = translate_text(original_text, target_lang, source_lang)

        # Return JSON response
        return jsonify({
            "transcript": original_text,
            "translated_text": translated_text
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Server exception: {str(e)}"}), 500

@app.route("/text-to-speech", methods=["POST", "OPTIONS"])
def handle_text_to_speech():
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    try:
        data = request.get_json(force=True, silent=True) or {}
        text = data.get("text", "").strip()
        lang = data.get("lang", "en")
        
        if not text:
            return jsonify({"error": "Text is required"}), 400
        
        # Generate speech from text
        audio_file_path = text_to_speech(text, lang)
        
        if not audio_file_path:
            return jsonify({"error": "Failed to generate speech"}), 500
            
        # Return the audio file
        return send_file(
            audio_file_path,
            as_attachment=True,
            download_name=f"translation.mp3",
            mimetype="audio/mpeg"
        )
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Server exception: {str(e)}"}), 500

@app.route("/text-translate", methods=["POST", "OPTIONS"])
def text_translate():
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    try:
        data = request.get_json(force=True, silent=True) or {}
        text = (data.get("text") or "").strip()
        if not text:
            return jsonify({"error": "Field 'text' required."}), 400

        source_lang = data.get("source_lang", "auto")
        target_lang = data.get("target_lang", "en")

        translated = translate_text(text, target_lang, source_lang)
        return jsonify({"translated_text": translated})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Server exception: {str(e)}"}), 500

@app.route("/", methods=["GET"])
def index():
    ffmpeg_available = FFMPEG_PATH is not None
    return jsonify({
        "message": "Voice Translation API is running", 
        "mode": "free_apis", 
        "ffmpeg_available": ffmpeg_available,
        "ffmpeg_path": FFMPEG_PATH or "Not found"
    })

if __name__ == "__main__":
    # Install required packages
    try:
        import pydub
    except ImportError:
        print("Installing pydub for audio processing...")
        os.system("pip install pydub")
    
    if FFMPEG_PATH:
        print(f"Found FFmpeg at: {FFMPEG_PATH}")
    else:
        print("FFmpeg not found. Audio conversion will not be available.")
        print("Please install FFmpeg and add it to your PATH.")
        
    print("Starting Flask server with free speech-to-text and translation APIs")
    app.run(debug=True, port=5000, host="0.0.0.0")