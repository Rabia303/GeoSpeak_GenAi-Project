from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tempfile
import os
import traceback
from deep_translator import GoogleTranslator
from PIL import Image
import io
from gtts import gTTS
import requests
import base64
import pytesseract
import cv2
import numpy as np

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"])

app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB

# Set the path to Tesseract executable (Your custom installation path)
pytesseract.pytesseract.tesseract_cmd = r'C:\Users\Dell\Desktop\Tesseract-OCR\tesseract.exe'

def preprocess_image(image_data):
    """Preprocess image to improve OCR accuracy"""
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply noise reduction
        denoised = cv2.medianBlur(gray, 3)
        
        # Apply threshold to get image with only black and white
        thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        
        # Apply dilation to connect broken parts of text
        kernel = np.ones((1, 1), np.uint8)
        processed = cv2.dilate(thresh, kernel, iterations=1)
        
        return processed
    except Exception as e:
        print(f"Error in image preprocessing: {e}")
        # Fallback: return original image data as numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

def extract_text_from_image(image_data):
    """Extract text from image using Tesseract OCR"""
    try:
        # Preprocess the image
        processed_image = preprocess_image(image_data)
        
        # Use Tesseract to extract text
        custom_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(processed_image, config=custom_config)
        
        if text and text.strip():
            return text.strip()
        else:
            # Fallback to online OCR if Tesseract fails
            return extract_text_online_fallback(image_data)
            
    except Exception as e:
        print(f"Error in Tesseract OCR: {e}")
        # Fallback to online OCR
        return extract_text_online_fallback(image_data)

def extract_text_online_fallback(image_data):
    """Fallback to online OCR if Tesseract fails"""
    try:
        # Using a free OCR API as an alternative to local OCR
        api_url = "https://api.ocr.space/parse/image"
        
        # Encode image to base64
        encoded_image = base64.b64encode(image_data).decode('utf-8')
        
        payload = {
            'apikey': 'K82755051688957',  # Free API key (has limitations)
            'base64Image': f'data:image/jpeg;base64,{encoded_image}',
            'language': 'eng',
            'isOverlayRequired': False
        }
        
        response = requests.post(api_url, data=payload)
        result = response.json()
        
        if result['IsErroredOnProcessing']:
            return None
            
        return result['ParsedResults'][0]['ParsedText'].strip()
        
    except Exception as e:
        print(f"Error in online OCR fallback: {e}")
        return None

def translate_text(text, target_lang, source_lang='auto'):
    """Translate text to target language"""
    try:
        if text and text.strip():
            # Split text into chunks to handle long text
            chunks = [text[i:i+4000] for i in range(0, len(text), 4000)]
            translated_chunks = []
            
            for chunk in chunks:
                translation = GoogleTranslator(source=source_lang, target=target_lang).translate(chunk)
                translated_chunks.append(translation)
            
            return " ".join(translated_chunks)
        return text
    except Exception as e:
        print(f"Translation error: {e}")
        return f"Translation error: {str(e)}"

def text_to_speech(text, lang='en'):
    """Convert text to speech"""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
            tts = gTTS(text=text, lang=lang, slow=False)
            tts.save(tmp_file.name)
            return tmp_file.name
    except Exception as e:
        print(f"Error in text-to-speech: {e}")
        return None

def test_tesseract():
    """Test function to verify Tesseract is working"""
    try:
        # Create a simple test image with text
        from PIL import Image, ImageDraw, ImageFont
        import tempfile
        
        # Create a white image
        img = Image.new('RGB', (400, 200), color='white')
        d = ImageDraw.Draw(img)
        
        # Try to use a basic font
        try:
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
            
        # Add text to image
        d.text((10, 10), "Hello, Tesseract!", fill='black', font=font)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            img.save(tmp.name)
            
            # Try to extract text
            text = pytesseract.image_to_string(Image.open(tmp.name))
            print(f"Tesseract test result: '{text}'")
            
            # Clean up
            os.unlink(tmp.name)
            
        return "Tesseract is working!" if "Hello" in text else f"Tesseract test failed: {text}"
    except Exception as e:
        return f"Tesseract test error: {str(e)}"

@app.route("/health", methods=["GET"])
def health():
    # Test Tesseract
    tesseract_test = test_tesseract()
    
    info = {
        "status": "OK", 
        "ocr_available": "Tesseract" in tesseract_test, 
        "mode": "tesseract_with_fallback",
        "tesseract_test": tesseract_test
    }
    return jsonify(info)

@app.route("/image-translate", methods=["POST", "OPTIONS"])
def image_translate():
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded (field name must be 'image')."}), 400

        image_file = request.files["image"]
        target_lang = request.form.get("target_lang", "en")
        source_lang = request.form.get("source_lang", "auto")

        image_data = image_file.read()
        
        # Extract text from image
        extracted_text = extract_text_from_image(image_data)
        
        if not extracted_text:
            return jsonify({"error": "No text could be extracted from the image"}), 400

        # Translate text
        translated_text = translate_text(extracted_text, target_lang, source_lang)

        # Return JSON response
        return jsonify({
            "extracted_text": extracted_text,
            "translated_text": translated_text
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Server exception: {str(e)}"}), 500

@app.route("/image-text-to-speech", methods=["POST", "OPTIONS"])
def image_text_to_speech():
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

@app.route("/test-tesseract", methods=["GET"])
def test_tesseract_route():
    result = test_tesseract()
    return jsonify({"result": result})

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "message": "Image Translation API is running", 
        "mode": "tesseract_with_fallback"
    })

if __name__ == "__main__":
    print("Starting Flask server for image translation with Tesseract OCR")
    # Test Tesseract on startup
    test_result = test_tesseract()
    print(f"Tesseract test: {test_result}")
    app.run(debug=True, port=5001, host="0.0.0.0")