from flask import Flask, request, jsonify
from flask_cors import CORS
from deep_translator import GoogleTranslator
import json
from datetime import datetime
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize translator
def translate_text(text, source_lang, target_lang):
    """
    Translate text from source language to target language
    """
    try:
        # Use 'auto' for automatic language detection if source is not specified
        if source_lang == 'auto':
            translated = GoogleTranslator(source='auto', target=target_lang).translate(text)
        else:
            translated = GoogleTranslator(source=source_lang, target=target_lang).translate(text)
        return translated
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return None

@app.route('/translate', methods=['POST'])
def translate():
    """
    Endpoint for translating text
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        text = data.get('text', '')
        source_lang = data.get('source_lang', 'auto')
        target_lang = data.get('target_lang', 'en')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Translate the text
        translated_text = translate_text(text, source_lang, target_lang)
        
        if translated_text is None:
            return jsonify({'error': 'Translation failed. Please check your input and try again.'}), 500
        
        return jsonify({
            'original_text': text,
            'translated_text': translated_text,
            'source_lang': source_lang,
            'target_lang': target_lang,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in translate endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/save-conversation', methods=['POST'])
def save_conversation():
    """
    Endpoint for saving conversation history
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        conversation = data.get('conversation', [])
        source_lang = data.get('source_lang', 'en')
        target_lang = data.get('target_lang', 'es')
        
        if not conversation:
            return jsonify({'error': 'No conversation data provided'}), 400
        
        # Create conversations directory if it doesn't exist
        if not os.path.exists('conversations'):
            os.makedirs('conversations')
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"conversations/conversation_{timestamp}.json"
        
        # Prepare data to save
        save_data = {
            'metadata': {
                'source_language': source_lang,
                'target_language': target_lang,
                'saved_at': datetime.now().isoformat()
            },
            'conversation': conversation
        }
        
        # Save to file
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            'message': 'Conversation saved successfully',
            'filename': filename
        })
        
    except Exception as e:
        logger.error(f"Error in save-conversation endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/get-languages', methods=['GET'])
def get_languages():
    """
    Endpoint for getting supported languages
    """
    try:
        # Google Translator supported languages
        languages = GoogleTranslator().get_supported_languages(as_dict=True)
        return jsonify({'languages': languages})
    except Exception as e:
        logger.error(f"Error getting languages: {e}")
        return jsonify({'error': 'Failed to retrieve languages'}), 500

@app.route('/detect-language', methods=['POST'])
def detect_language():
    """
    Endpoint for detecting language of text
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Detect language
        detected_lang = GoogleTranslator().detect(text)
        
        return jsonify({
            'text': text,
            'detected_language': detected_lang
        })
        
    except Exception as e:
        logger.error(f"Error in detect-language endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "OK", "message": "Conversation server is running"})

if __name__ == '__main__':
    print("Starting Conversation Server...")
    app.run(debug=True, port=5000)