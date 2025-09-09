from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import os
import json
from datetime import datetime, timedelta
import jwt
from functools import wraps

app = Flask(__name__)
app.secret_key = 'your-secret-key-here-change-this-in-production'

# Enhanced CORS configuration
CORS(app, 
     supports_credentials=True, 
     origins=["http://localhost:5173", "http://127.0.0.1:5173"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# JWT configuration
app.config['JWT_SECRET_KEY'] = 'jwt-secret-key-change-in-production'
app.config['JWT_ALGORITHM'] = 'HS256'

# File to store user data
DATA_FILE = "users.txt"

def ensure_data_file():
    """Create the data file if it doesn't exist"""
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w') as f:
            f.write("")

def read_users():
    """Read all users from the text file"""
    ensure_data_file()
    users = {}
    try:
        with open(DATA_FILE, 'r') as f:
            for line in f:
                if line.strip():
                    user_data = json.loads(line.strip())
                    users[user_data['email']] = user_data
    except Exception as e:
        print(f"Error reading users: {e}")
    return users

def write_user(user_data):
    """Write a new user to the text file"""
    ensure_data_file()
    with open(DATA_FILE, 'a') as f:
        f.write(json.dumps(user_data) + '\n')

def hash_password(password):
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token(user_id, email):
    """Generate a JWT token"""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, app.config['JWT_SECRET_KEY'], algorithm=app.config['JWT_ALGORITHM'])

def token_required(f):
    """Decorator to verify JWT tokens"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'success': False, 'message': 'Invalid token format'}), 401
        
        # Also check for token in cookies (for browser compatibility)
        if not token and 'token' in request.cookies:
            token = request.cookies.get('token')
        
        if not token:
            return jsonify({'success': False, 'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=[app.config['JWT_ALGORITHM']])
            current_user = {
                'id': data['user_id'],
                'email': data['email']
            }
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

@app.after_request
def after_request(response):
    """Add headers to both preflight and actual responses"""
    origin = request.headers.get('Origin')
    if origin and origin in ['http://localhost:5173', 'http://127.0.0.1:5173']:
        response.headers.add('Access-Control-Allow-Origin', origin)
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirmPassword')
    
    if not name or not email or not password:
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    if password != confirm_password:
        return jsonify({'success': False, 'message': 'Passwords do not match'}), 400
    
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
    
    users = read_users()
    if email in users:
        return jsonify({'success': False, 'message': 'Email already exists'}), 409
    
    hashed_password = hash_password(password)
    user_id = hashlib.sha256(email.encode()).hexdigest()[:12]
    user_data = {
        'id': user_id,
        'name': name,
        'email': email,
        'password': hashed_password,
        'created_at': datetime.now().isoformat()
    }
    
    write_user(user_data)
    
    # Generate token
    token = generate_token(user_id, email)
    
    response = jsonify({
        'success': True, 
        'message': 'User created successfully',
        'token': token,
        'user': {
            'id': user_id,
            'name': name,
            'email': email
        }
    })
    
    # Set token as HTTP-only cookie for better security
    response.set_cookie(
        'token', 
        token, 
        httponly=True, 
        samesite='Lax',
        max_age=24*60*60  # 24 hours
    )
    
    return response, 201

@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password required'}), 400
    
    users = read_users()
    if email not in users or users[email]['password'] != hash_password(password):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
    # Generate token
    token = generate_token(users[email]['id'], email)
    
    user_info = {
        'id': users[email]['id'],
        'name': users[email]['name'],
        'email': users[email]['email']
    }
    
    response = jsonify({
        'success': True, 
        'message': 'Login successful', 
        'token': token,
        'user': user_info
    })
    
    # Set token as HTTP-only cookie for better security
    response.set_cookie(
        'token', 
        token, 
        httponly=True, 
        samesite='Lax',
        max_age=24*60*60  # 24 hours
    )
    
    return response, 200

@app.route('/logout', methods=['POST', 'OPTIONS'])
@token_required
def logout(current_user):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    response = jsonify({'success': True, 'message': 'Logged out successfully'})
    response.delete_cookie('token')
    return response, 200

@app.route('/user', methods=['GET', 'OPTIONS'])
@token_required
def get_user(current_user):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    # Get user data from database
    users = read_users()
    if current_user['email'] not in users:
        return jsonify({'success': False, 'message': 'User not found'}), 404
        
    user_data = users[current_user['email']]
    
    return jsonify({
        'success': True, 
        'user': {
            'id': user_data['id'],
            'name': user_data['name'],
            'email': user_data['email']
        }
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')