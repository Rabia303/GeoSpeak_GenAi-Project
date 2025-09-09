import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import logging
import urllib.parse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Reduced language mapping to 20 most common languages
LANGUAGES = {
    'auto': 'Auto Detect',
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'ur': 'Urdu',
    'tr': 'Turkish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'pl': 'Polish',
    'id': 'Indonesian',
    'vi': 'Vietnamese',
    'th': 'Thai'
}

# Get supported languages with proper names
def get_supported_languages():
    languages = []
    for code, name in LANGUAGES.items():
        languages.append({"code": code, "name": name})
    
    # Sort by language name
    languages.sort(key=lambda x: x["name"])
    return languages

# Improved translation function with better API selection
def translate_text_api(text, target_lang, source_lang='auto'):
    # Try multiple translation APIs with better language-specific selection
    apis = []
    
    # For certain language pairs, prefer specific APIs
    if target_lang in ['ur', 'ar', 'hi']:  # Urdu, Arabic, Hindi
        # MyMemory works better for these languages
        apis = [
            translate_with_mymemory,
            translate_with_google_translate
        ]
    else:
        # Default order for other languages
        apis = [
            translate_with_google_translate,
            translate_with_mymemory
        ]
    
    for api in apis:
        try:
            result = api(text, target_lang, source_lang)
            if result and result['text'].strip():
                return result
        except Exception as e:
            logger.warning(f"API {api.__name__} failed: {e}")
            continue
    
    # All APIs failed, use simple fallback
    return simple_translate(text, target_lang, source_lang)

# Translation using MyMemory API
def translate_with_mymemory(text, target_lang, source_lang='auto'):
    try:
        if source_lang == 'auto':
            source_lang = 'en'  # Default to English for auto detection
            
        # Properly encode the text for URL
        encoded_text = urllib.parse.quote(text)
        url = f"https://api.mymemory.translated.net/get?q={encoded_text}&langpair={source_lang}|{target_lang}"
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        if 'responseData' in result and 'translatedText' in result['responseData']:
            return {
                "text": result['responseData']['translatedText'],
                "src": source_lang
            }
        else:
            raise Exception("Invalid response from MyMemory API")
    except Exception as e:
        logger.error(f"MyMemory API error: {e}")
        raise e

# Translation using Google Translate (updated endpoint)
def translate_with_google_translate(text, target_lang, source_lang='auto'):
    try:
        # Updated Google Translate endpoint
        url = "https://translate.google.com/translate_a/single"
        
        params = {
            'client': 'gtx',
            'sl': source_lang,
            'tl': target_lang,
            'dt': 't',
            'q': text
        }
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        # Extract translated text from the complex response structure
        if isinstance(result, list) and len(result) > 0:
            translated_text = ''
            for item in result[0]:
                if item[0]:
                    translated_text += item[0]
            
            detected_lang = source_lang
            if source_lang == 'auto' and len(result) > 2:
                detected_lang = result[2]
            
            return {
                "text": translated_text,
                "src": detected_lang
            }
        else:
            raise Exception("Invalid response from Google Translate")
    except Exception as e:
        logger.error(f"Google Translate API error: {e}")
        raise e

# Simple fallback translation function
def simple_translate(text, target_lang, source_lang='auto'):
    # This is a very basic fallback that just returns the text with a prefix
    return {
        "text": f"[Translated to {LANGUAGES.get(target_lang, target_lang)}] {text}",
        "src": source_lang if source_lang != 'auto' else 'en'
    }

# Main translation function with fallbacks
def sync_translate(text, target_lang, source_lang='auto'):
    return translate_text_api(text, target_lang, source_lang)

# Translation endpoint (no authentication required)
@app.route('/translate', methods=['POST'])
def translate_text():
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        target_lang = data.get('target_lang', 'en')
        source_lang = data.get('source_lang', 'auto')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        # Check text length
        if len(text) > 5000:
            return jsonify({"error": "Text too long. Maximum 5000 characters allowed."}), 400
        
        # Translate the text
        translation = sync_translate(text, target_lang, source_lang)
        
        return jsonify({
            "translated_text": translation['text'],
            "source_lang": translation['src']
        })
    
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return jsonify({"error": "Translation service temporarily unavailable. Please try again."}), 500

# Get supported languages endpoint
@app.route('/languages', methods=['GET'])
def get_languages():
    try:
        languages = get_supported_languages()
        return jsonify(languages)
    except Exception as e:
        logger.error(f"Error getting languages: {e}")
        return jsonify({"error": str(e)}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "OK", "message": "Translation server is running"})

if __name__ == '__main__':
    print("Starting Text Translator Server...")
    print("Supported languages loaded:", len(LANGUAGES))
    app.run(debug=True, port=5001, host='0.0.0.0')