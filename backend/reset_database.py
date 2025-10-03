import sqlite3
import os

def reset_database_final():
    # Delete existing database
    if os.path.exists('database/notes.db'):
        os.remove('database/notes.db')
        print("Old database removed")
    
    # Recreate database
    conn = sqlite3.connect('database/notes.db')
    c = conn.cursor()
    
    # Create all tables
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
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY(user_id) REFERENCES users(id),
                  FOREIGN KEY(note_id) REFERENCES notes(id))''')
    
    # Get list of your actual PDF files
    pdf_files = os.listdir('uploads')
    print("Found PDF files:", pdf_files)
    
    # Create notes - make sure first note is FREE
    notes_data = []
    
    for i, pdf_file in enumerate(pdf_files):
        if pdf_file.endswith('.pdf'):
            # Make first note FREE, others premium
            if i == 0:  # First note is FREE
                notes_data.append((
                    'Machine Learning - FREE TEST', 
                    'Complete ML notes (FREE FOR TESTING)', 
                    'Machine Learning', 
                    'https://youtube.com/watch?v=free_test', 
                    pdf_file, 
                    0.00, 
                    False
                ))
            else:  # Other notes are premium
                notes_data.append((
                    f'{pdf_file.replace(".pdf", "").replace("_", " ").title()} - PREMIUM', 
                    f'Premium content for {pdf_file.replace(".pdf", "")}', 
                    'Machine Learning', 
                    'https://youtube.com/watch?v=premium', 
                    pdf_file, 
                    99.00, 
                    True
                ))
    
    # Insert notes
    c.executemany('''INSERT INTO notes (title, description, subject, youtube_url, file_path, price, is_premium) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)''', notes_data)
    
    conn.commit()
    print(f"Added {len(notes_data)} notes to database:")
    for note in notes_data:
        print(f" - {note[0]} -> ₹{note[5]} (Premium: {note[6]})")
    
    conn.close()

if __name__ == '__main__':
    reset_database_final()