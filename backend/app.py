from flask import Flask, request, jsonify, send_file, send_from_directory, Response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
import datetime  # Make sure this is imported
import fitz  # PyMuPDF
from io import BytesIO
import base64
from PIL import Image, ImageDraw
import random
import os
from dotenv import load_dotenv
import razorpay
import hmac
import hashlib
import json

load_dotenv()  # Load once at the top

# JWT Configuration (from .env with fallback)
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-super-secret-key-change-this-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=24)  # 24 hour expiry
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Razorpay Configuration (active version only)
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"], supports_credentials=True)

jwt = JWTManager(app)

# Enhanced JWT Error Handlers (added logging for validation errors)
@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"🔒 JWT Unauthorized: {error}")  # Log for debug
    return jsonify({
        'error': 'Authorization required',
        'message': 'Request does not contain an access token'
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"🔒 JWT Invalid Token: {error}")  # Log the exact error (e.g., "Subject must be a string")
    return jsonify({
        'error': 'Invalid token',
        'message': 'Signature verification failed'
    }), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print(f"🔒 JWT Expired Token")  # Log for debug
    return jsonify({
        'error': 'Token expired', 
        'message': 'The token has expired'
    }), 401

# Database initialization (unchanged)
def init_db():
    conn = sqlite3.connect('database/notes.db')
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  email TEXT UNIQUE NOT NULL,
                  password TEXT NOT NULL,
                  is_premium BOOLEAN DEFAULT FALSE,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS notes
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  description TEXT,
                  subject TEXT NOT NULL,
                  youtube_url TEXT,
                  file_path TEXT NOT NULL,
                  price DECIMAL(10,2) DEFAULT 0.00,
                  is_premium BOOLEAN DEFAULT FALSE,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS user_access
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  note_id INTEGER,
                  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY(user_id) REFERENCES users(id),
                  FOREIGN KEY(note_id) REFERENCES notes(id))''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS payments
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  note_id INTEGER,
                  amount DECIMAL(10,2),
                  payment_id TEXT,
                  status TEXT,
                  payment_method TEXT DEFAULT 'upi',
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY(user_id) REFERENCES users(id),
                  FOREIGN KEY(note_id) REFERENCES notes(id))''')
    
    # Create upi_transactions table if it doesn't exist
    c.execute('''CREATE TABLE IF NOT EXISTS upi_transactions
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  note_id INTEGER NOT NULL,
                  amount DECIMAL(10,2) NOT NULL,
                  transaction_id TEXT UNIQUE NOT NULL,
                  status TEXT DEFAULT 'created',
                  verified_at TIMESTAMP NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY(user_id) REFERENCES users(id),
                  FOREIGN KEY(note_id) REFERENCES notes(id))''')
    
    # Create premium_licenses table if it doesn't exist
    c.execute('''CREATE TABLE IF NOT EXISTS premium_licenses
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  note_id INTEGER NOT NULL,
                  license_key TEXT UNIQUE NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY(user_id) REFERENCES users(id),
                  FOREIGN KEY(note_id) REFERENCES notes(id))''')
    
    conn.commit()
    
    c.execute("SELECT COUNT(*) FROM notes")
    count = c.fetchone()[0]
    
    if count == 0:
        print("No notes found in database, please run reset_database.py")
    
    conn.close()

init_db()

@app.route('/api/payment/initiate', methods=['POST'])
@jwt_required()
def initiate_payment():
    """Initiate payment via Razorpay - SIMPLIFIED FIXED VERSION"""
    try:
        user_id_str = get_jwt_identity()  # Now a string, e.g., "1"
        user_id = int(user_id_str)  # Convert to int for DB queries (FIX: Handles string identity)
        data = request.get_json()
        
        print(f"🔄 Payment initiation request received")
        print(f"User ID (str): {user_id_str}, (int): {user_id}")
        print(f"Request data: {data}")
        
        # Basic validation
        if not data:
            print("❌ No data received")
            return jsonify({'error': 'No data received'}), 422
            
        note_id = data.get('note_id')
        print(f"Note ID from request: {note_id}")
        
        if note_id is None:
            print("❌ Note ID is missing")
            return jsonify({'error': 'Note ID is required'}), 422
        
        # Convert to integer
        try:
            note_id = int(note_id)
        except (ValueError, TypeError):
            print(f"❌ Invalid note ID format: {note_id}")
            return jsonify({'error': 'Invalid note ID format'}), 422
        
        conn = sqlite3.connect('database/notes.db')
        c = conn.cursor()
        
        # Get note details
        c.execute('SELECT id, title, price FROM notes WHERE id = ?', (note_id,))
        note = c.fetchone()
        
        if not note:
            print(f"❌ Note {note_id} not found in database")
            conn.close()
            return jsonify({'error': 'Note not found'}), 404
        
        note_id, title, price = note
        price = float(price) if price else 0.0
        
        print(f"✅ Note found: {title}, Price: {price}")
        
        # Check if already purchased
        c.execute('SELECT id FROM payments WHERE user_id = ? AND note_id = ? AND status = "success"', 
                 (user_id, note_id))
        
        if c.fetchone():
            print("✅ Note already purchased")
            conn.close()
            return jsonify({'error': 'Note already purchased'}), 400
        
        # For free notes
        if price == 0:
            print("🎁 Free note - granting access")
            c.execute('INSERT INTO payments (user_id, note_id, amount, payment_id, status) VALUES (?, ?, ?, ?, ?)',
                     (user_id, note_id, 0, f'free_{user_id}_{note_id}', 'success'))
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'free_note': True, 'message': 'Access granted'})
        
        # Create Razorpay order
        amount_in_paise = int(price * 100)
        if amount_in_paise < 100:
            amount_in_paise = 100
            
        order_data = {
            'amount': amount_in_paise,
            'currency': 'INR',
            'payment_capture': 1,
            'notes': {
                'note_id': str(note_id),
                'user_id': str(user_id)
            }
        }
        
        print(f"💰 Creating Razorpay order: {order_data}")
        
        try:
            razorpay_order = client.order.create(data=order_data)
            print(f"✅ Razorpay order created: {razorpay_order['id']}")
        except Exception as e:
            print(f"❌ Razorpay error: {e}")
            conn.close()
            return jsonify({'error': f'Payment gateway error: {str(e)}'}), 500
        
        # Store transaction
        c.execute('INSERT INTO upi_transactions (user_id, note_id, amount, transaction_id, status) VALUES (?, ?, ?, ?, ?)',
                 (user_id, note_id, price, razorpay_order['id'], 'created'))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'order_id': razorpay_order['id'],
            'amount': price,
            'currency': 'INR',
            'key_id': RAZORPAY_KEY_ID,
            'note_title': title
        })
        
    except ValueError as ve:  # Catch int() conversion errors
        print(f"❌ User ID conversion error: {ve}")
        return jsonify({'error': 'Invalid user session'}), 401
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/payment/verify', methods=['POST'])
@jwt_required()
def verify_payment():
    """Verify payment manually (for frontend callback) - UPDATED"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        print(f"🔄 Manual payment verification: {data}")
        
        # Use correct parameter names that match frontend
        order_id = data.get('razorpay_order_id')
        payment_id = data.get('razorpay_payment_id')
        signature = data.get('razorpay_signature')
        
        if not all([order_id, payment_id, signature]):
            return jsonify({'error': 'Missing payment details'}), 400
        
        print(f"🔍 Verification params - Order: {order_id}, Payment: {payment_id}")
        
        # Verify signature
        body = f"{order_id}|{payment_id}"
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            body.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != signature:
            print(f"❌ Signature mismatch: {generated_signature} vs {signature}")
            return jsonify({'error': 'Invalid signature'}), 400
        
        # Fetch order details
        try:
            order = client.order.fetch(order_id)
            print(f"📦 Order details: {order}")
        except Exception as order_error:
            print(f"❌ Error fetching order: {order_error}")
            return jsonify({'error': 'Invalid order ID'}), 400
        
        if order.get('status') == 'paid':
            # Extract note_id from order notes
            note_id = order.get('notes', {}).get('note_id')
            if not note_id:
                # Try to get from upi_transactions as fallback
                conn = sqlite3.connect('database/notes.db')
                c = conn.cursor()
                c.execute('SELECT note_id FROM upi_transactions WHERE transaction_id = ?', (order_id,))
                transaction = c.fetchone()
                if transaction:
                    note_id = transaction[0]
                conn.close()
            
            if not note_id:
                return jsonify({'error': 'Could not determine note ID'}), 400
            
            note_id = int(note_id)
            amount = float(order['amount']) / 100
            
            conn = sqlite3.connect('database/notes.db')
            c = conn.cursor()
            
            # Update transaction status
            c.execute('''UPDATE upi_transactions 
                         SET status = 'success', verified_at = CURRENT_TIMESTAMP 
                         WHERE transaction_id = ? AND user_id = ?''', 
                     (order_id, user_id))
            
            # Record successful payment
            c.execute('''INSERT INTO payments 
                        (user_id, note_id, amount, payment_id, status, payment_method) 
                        VALUES (?, ?, ?, ?, ?, ?)''', 
                     (user_id, note_id, amount, payment_id, 'success', 'razorpay'))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Payment verified successfully for order {order_id}, note {note_id}")
            
            return jsonify({
                'success': True,
                'message': 'Payment verified successfully',
                'payment_id': payment_id,
                'note_id': note_id,
                'access_granted': True
            })
        else:
            print(f"❌ Order not paid, status: {order.get('status')}")
            return jsonify({'error': 'Payment not completed'}), 400
            
    except Exception as e:
        print(f"❌ Error verifying payment: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Payment verification failed: {str(e)}'}), 500


@app.route('/api/payment/user-purchases', methods=['GET'])
@jwt_required()
def get_user_purchases():
    """Get all purchases for the current user"""
    try:
        user_id = get_jwt_identity()
        
        conn = sqlite3.connect('database/notes.db')
        c = conn.cursor()
        
        c.execute('''
            SELECT note_id, status, amount, payment_id, created_at 
            FROM payments 
            WHERE user_id = ? AND status = 'success'
            ORDER BY created_at DESC
        ''', (user_id,))
        
        purchases = c.fetchall()
        conn.close()
        
        purchases_list = []
        for purchase in purchases:
            note_id, status, amount, payment_id, created_at = purchase
            purchases_list.append({
                'note_id': note_id,
                'status': status,
                'amount': float(amount) if amount else 0,
                'payment_id': payment_id,
                'purchased_at': created_at
            })
        
        return jsonify(purchases_list)
        
    except Exception as e:
        print(f"Error getting user purchases: {e}")
        return jsonify({'error': 'Failed to get purchases'}), 500



@app.route('/api/payment/status/<order_id>', methods=['GET'])
@jwt_required()
def check_payment_status(order_id):
    """Check payment status - FIXED VERSION"""
    try:
        user_id_str = get_jwt_identity()  # String
        user_id = int(user_id_str)  # Convert (FIX)
        
        print(f"🔄 Checking payment status for order: {order_id}")
        
        conn = sqlite3.connect('database/notes.db')
        c = conn.cursor()
        
        c.execute('''SELECT status, verified_at, amount, note_id 
                     FROM upi_transactions 
                     WHERE transaction_id = ? AND user_id = ?''',
                 (order_id, user_id))
        
        transaction = c.fetchone()
        
        if not transaction:
            conn.close()
            return jsonify({'error': 'Transaction not found'}), 404
        
        status, verified_at, amount, note_id = transaction
        
        # If status is still created, check with Razorpay
        if status == 'created':
            try:
                order = client.order.fetch(order_id)
                print(f"📦 Razorpay order status: {order.get('status')}")
                
                if order.get('status') == 'paid':
                    # Payment successful, update our database
                    payments = order.get('payments', [])
                    if payments:
                        payment = payments[0]
                        
                        c.execute('''UPDATE upi_transactions 
                                     SET status = 'success', verified_at = CURRENT_TIMESTAMP 
                                     WHERE transaction_id = ? AND user_id = ?''', 
                                 (order_id, user_id))
                        
                        c.execute('''INSERT INTO payments 
                                    (user_id, note_id, amount, payment_id, status, payment_method) 
                                    VALUES (?, ?, ?, ?, ?, ?)''', 
                                 (user_id, note_id, amount, payment['id'], 'success', payment.get('method', 'upi')))
                        
                        status = 'success'
                        conn.commit()
                        print(f"✅ Updated payment status to success for order {order_id}")
            except Exception as e:
                print(f"⚠️ Error checking Razorpay status: {e}")
        
        conn.close()
        
        return jsonify({
            'status': status,
            'verified_at': verified_at,
            'amount': float(amount) if amount else 0,
            'note_id': note_id
        })
        
    except ValueError as ve:  # Catch int() errors
        print(f"❌ User ID conversion error: {ve}")
        return jsonify({'error': 'Invalid user session'}), 401
    except Exception as e:
        print(f"❌ Error checking payment status: {str(e)}")
        return jsonify({'error': 'Failed to check status'}), 500







# Add to your backend/app.py

@app.route('/api/playlists', methods=['GET'])
def get_playlists():
    """Get all YouTube playlists with their videos and notes"""
    conn = sqlite3.connect('database/notes.db')
    c = conn.cursor()
    
    c.execute('''
        SELECT DISTINCT subject, youtube_url 
        FROM notes 
        WHERE youtube_url IS NOT NULL 
        ORDER BY subject
    ''')
    
    playlists = c.fetchall()
    
    playlists_data = []
    for subject, youtube_url in playlists:
        # Get all notes for this subject
        c.execute('''
            SELECT id, title, description, file_path, price, is_premium
            FROM notes 
            WHERE subject = ? 
            ORDER BY created_at
        ''', (subject,))
        
        notes = c.fetchall()
        notes_list = []
        
        for note in notes:
            note_id, title, description, file_path, price, is_premium = note
            notes_list.append({
                'id': note_id,
                'title': title,
                'description': description,
                'file_path': file_path,
                'price': float(price),
                'is_premium': bool(is_premium),
                'download_url': f'/api/notes/{note_id}/download'
            })
        
        playlists_data.append({
            'subject': subject,
            'youtube_playlist': youtube_url,
            'total_videos': len(notes_list),
            'notes': notes_list
        })
    
    conn.close()
    return jsonify(playlists_data)










# ========== DEBUG ENDPOINTS ==========
@app.route('/api/debug/tables', methods=['GET'])
def debug_tables():
    """Debug endpoint to check database tables"""
    conn = sqlite3.connect('database/notes.db')
    c = conn.cursor()
    
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = c.fetchall()
    
    table_info = {}
    for table in tables:
        table_name = table[0]
        c.execute(f"PRAGMA table_info({table_name})")
        columns = c.fetchall()
        table_info[table_name] = [col[1] for col in columns]  # Column names
    
    conn.close()
    
    return jsonify({
        'tables': [table[0] for table in tables],
        'table_structure': table_info
    })

@app.route('/api/debug/notes-data', methods=['GET'])
def debug_notes_data():
    """Debug endpoint to check notes data"""
    conn = sqlite3.connect('database/notes.db')
    c = conn.cursor()
    
    c.execute('SELECT id, title, price, is_premium FROM notes ORDER BY id')
    notes = c.fetchall()
    
    notes_list = []
    for note in notes:
        notes_list.append({
            'id': note[0],
            'title': note[1],
            'price': note[2],
            'is_premium': bool(note[3])
        })
    
    conn.close()
    
    return jsonify({
        'total_notes': len(notes_list),
        'notes': notes_list
    })

@app.route('/api/debug/payment-init', methods=['POST'])
@jwt_required()
def debug_payment_init():
    """Debug endpoint to see exactly what's happening"""
    try:
        user_id_str = get_jwt_identity()  # String
        user_id = int(user_id_str)  # Convert (FIX)
        data = request.get_json()
        
        print("🔍 DEBUG PAYMENT INITIATION:")
        print(f"User ID (str): {user_id_str}, (int): {user_id}")
        print(f"Request data: {data}")
        print(f"Request headers: {dict(request.headers)}")
        
        if not data:
            return jsonify({'error': 'No data provided', 'debug': True}), 422
            
        note_id = data.get('note_id')
        
        if not note_id:
            return jsonify({'error': 'Note ID is required', 'debug': True}), 422
        
        # Check database connection
        conn = sqlite3.connect('database/notes.db')
        c = conn.cursor()
        
        # Check if note exists
        c.execute('SELECT id, title, price FROM notes WHERE id = ?', (note_id,))
        note = c.fetchone()
        
        if not note:
            conn.close()
            return jsonify({'error': f'Note {note_id} not found', 'debug': True}), 404
        
        note_id, title, price = note
        conn.close()
        
        return jsonify({
            'debug': True,
            'user_id': user_id,
            'note_id': note_id,
            'note_title': title,
            'price': price,
            'status': 'ready_for_payment'
        })
        
    except ValueError as ve:  # Catch int() errors
        print(f"❌ User ID conversion error: {ve}")
        return jsonify({'error': 'Invalid user session', 'debug': True}), 401
    except Exception as e:
        print(f"❌ Debug error: {e}")
        return jsonify({'error': str(e), 'debug': True}), 500

# ========== PROTECTED PDF VIEWER FUNCTIONS ==========
def pdf_to_images(pdf_path):
    """Convert PDF to images with error handling"""
    try:
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF not found: {pdf_path}")
            
        doc = fitz.open(pdf_path)
        images_data = []
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img_data = pix.tobytes("png")
            
            img_str = base64.b64encode(img_data).decode()
            
            images_data.append({
                'page_num': page_num + 1,
                'data': f"data:image/png;base64,{img_str}",
                'width': pix.width,
                'height': pix.height
            })
        
        doc.close()
        return images_data
        
    except Exception as e:
        print(f"Error converting PDF to images: {e}")
        return []

@app.route('/api/notes/<int:note_id>/protected-view', methods=['GET'])
def protected_pdf_view(note_id):
    """Serve PDF as protected images - Simple version"""
    try:
        conn = sqlite3.connect('database/notes.db')
        c = conn.cursor()
        
        c.execute('''SELECT title, file_path FROM notes WHERE id = ?''', (note_id,))
        note = c.fetchone()
        
        if not note:
            return jsonify({'error': 'Note not found'}), 404
        
        title, file_path = note
        conn.close()
        
        pdf_path = os.path.join('uploads', file_path)
        
        if not os.path.exists(pdf_path):
            return jsonify({'error': 'PDF file not found'}), 404
        
        # Convert PDF to images
        images = pdf_to_images(pdf_path)
        
        if not images:
            return jsonify({'error': 'Failed to process PDF'}), 500
        
        response = jsonify({
            'title': title,
            'total_pages': len(images),
            'pages': images,
            'timestamp': datetime.datetime.now().isoformat(),
            'session_id': os.urandom(16).hex()
        })
        
        # Security headers
        response.headers.add('Cache-Control', 'no-store, no-cache, must-revalidate, private')
        response.headers.add('Pragma', 'no-cache')
        response.headers.add('Expires', '0')
        response.headers.add('X-Content-Type-Options', 'nosniff')
        response.headers.add('X-Frame-Options', 'DENY')
        response.headers.add('X-XSS-Protection', '1; mode=block')
        
        return response
        
    except Exception as e:
        print(f"Error in protected view: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# ========== AUTHENTICATION ROUTES ==========
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    
    hashed_password = generate_password_hash(password)
    
    try:
        conn = sqlite3.connect('database/notes.db')
        c = conn.cursor()
        c.execute("INSERT INTO users (email, password) VALUES (?, ?)", 
                 (email, hashed_password))
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        
        access_token = create_access_token(identity=str(user_id))  # FIX: Cast to str for 'sub' claim
        return jsonify({'token': access_token, 'user_id': user_id}), 201
        
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already exists'}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    conn = sqlite3.connect('database/notes.db')
    c = conn.cursor()
    c.execute("SELECT id, password, is_premium FROM users WHERE email = ?", (email,))
    user = c.fetchone()
    conn.close()
    
    if user and check_password_hash(user[1], password):
        access_token = create_access_token(identity=str(user[0]))  # FIX: Cast to str for 'sub' claim
        return jsonify({
            'token': access_token, 
            'user_id': user[0],
            'is_premium': bool(user[2])
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401

# ========== NOTES ROUTES ==========
@app.route('/api/notes', methods=['GET'])
def get_notes():
    subject = request.args.get('subject')
    
    conn = sqlite3.connect('database/notes.db')
    c = conn.cursor()
    
    if subject and subject != 'All Subjects':
        c.execute('''SELECT id, title, description, subject, youtube_url, is_premium, price, file_path 
                     FROM notes WHERE subject = ? ORDER BY created_at DESC''', (subject,))
    else:
        c.execute('''SELECT id, title, description, subject, youtube_url, is_premium, price, file_path 
                     FROM notes ORDER BY created_at DESC''')
    
    notes = c.fetchall()
    conn.close()
    
    notes_list = []
    for note in notes:
        note_id, title, description, subject, youtube_url, is_premium, price, file_path = note
        
        file_exists = os.path.exists(os.path.join('uploads', file_path))
        
        notes_list.append({
            'id': note_id,
            'title': title,
            'description': description,
            'subject': subject,
            'youtube_url': youtube_url,
            'is_premium': bool(is_premium),
            'price': float(price),
            'has_access': True
        })
    
    return jsonify(notes_list)

# ========== PROTECTED PDF VIEWER ROUTES ==========
@app.route('/api/notes/<int:note_id>/check-access', methods=['GET'])
def check_note_access(note_id):
    """Check if user has access to a note - No JWT required"""
    try:
        conn = sqlite3.connect('database/notes.db')
        c = conn.cursor()
        
        # Simple query to get note details
        c.execute('''SELECT title, is_premium, price, file_path 
                     FROM notes WHERE id = ?''', (note_id,))
        
        note = c.fetchone()
        
        if not note:
            return jsonify({'error': 'Note not found'}), 404
        
        title, is_premium, price, file_path = note
        
        # For now, all free notes have access, premium notes don't
        # This will be handled by the frontend based on user login
        has_access = not is_premium
        
        conn.close()
        
        return jsonify({
            'has_access': has_access,
            'is_premium_note': bool(is_premium),
            'price': float(price),
            'title': title
        })
        
    except Exception as e:
        print(f"Error in check access: {e}")
        return jsonify({'error': 'Failed to check access'}), 500

# ========== TEST PURCHASE ROUTE ==========
@app.route('/api/test/purchase/<int:note_id>', methods=['POST'])
def test_purchase(note_id):
    """Test purchase endpoint - No JWT required"""
    try:
        user_id = 1  # Default test user
        
        conn = sqlite3.connect('database/notes.db')
        c = conn.cursor()
        
        c.execute('''SELECT title, price FROM notes WHERE id = ?''', (note_id,))
        note = c.fetchone()
        
        if not note:
            return jsonify({'error': 'Note not found'}), 404
        
        title, price = note
        
        c.execute('''INSERT INTO payments (user_id, note_id, amount, payment_id, status) 
                     VALUES (?, ?, ?, ?, ?)''', 
                  (user_id, note_id, price, f'test_payment_{user_id}_{note_id}', 'success'))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Test purchase successful for "{title}"!',
            'note_id': note_id
        })
        
    except Exception as e:
        print(f"Error in test purchase: {e}")
        return jsonify({'error': 'Purchase failed'}), 500

# ========== DEBUG ROUTES ==========
@app.route('/api/debug/notes', methods=['GET'])
def debug_notes():
    conn = sqlite3.connect('database/notes.db')
    c = conn.cursor()
    
    c.execute("SELECT * FROM notes")
    notes = c.fetchall()
    conn.close()
    
    return jsonify({
        'total_notes': len(notes),
        'notes': notes
    })

if __name__ == '__main__':
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    if not os.path.exists('database'):
        os.makedirs('database')
    print("🚀 Starting AKTU Notes Backend with PROTECTED PDF Viewer")
    print(f"🔑 Razorpay Key ID: {RAZORPAY_KEY_ID}")
    print(f"🔒 Razorpay Key Secret: {'*' * len(RAZORPAY_KEY_SECRET) if RAZORPAY_KEY_SECRET else 'NOT SET'}")
    print(f"🔑 JWT Secret: {'*' * min(10, len(app.config['JWT_SECRET_KEY']))}...")  # Log secret length for debug
    app.run(debug=True, port=5000)