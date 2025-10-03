# import sqlite3
# import os

# def fix_database():
#     conn = sqlite3.connect('database/notes.db')
#     c = conn.cursor()
    
#     # Create missing tables
#     c.execute('''CREATE TABLE IF NOT EXISTS upi_transactions
#                  (id INTEGER PRIMARY KEY AUTOINCREMENT,
#                   user_id INTEGER NOT NULL,
#                   note_id INTEGER NOT NULL,
#                   amount DECIMAL(10,2) NOT NULL,
#                   transaction_id TEXT UNIQUE NOT NULL,
#                   status TEXT DEFAULT 'created',
#                   verified_at TIMESTAMP NULL,
#                   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#                   FOREIGN KEY(user_id) REFERENCES users(id),
#                   FOREIGN KEY(note_id) REFERENCES notes(id))''')
    
#     # Add payment_method column to payments table
#     try:
#         c.execute("ALTER TABLE payments ADD COLUMN payment_method TEXT DEFAULT 'upi'")
#         print("✅ Added payment_method column to payments table")
#     except sqlite3.OperationalError:
#         print("✅ payment_method column already exists")
    
#     # Create premium_licenses table
#     c.execute('''CREATE TABLE IF NOT EXISTS premium_licenses
#                  (id INTEGER PRIMARY KEY AUTOINCREMENT,
#                   user_id INTEGER NOT NULL,
#                   note_id INTEGER NOT NULL,
#                   license_key TEXT UNIQUE NOT NULL,
#                   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#                   FOREIGN KEY(user_id) REFERENCES users(id),
#                   FOREIGN KEY(note_id) REFERENCES notes(id))''')
    
#     conn.commit()
    
#     # Verify tables
#     c.execute("SELECT name FROM sqlite_master WHERE type='table'")
#     tables = [table[0] for table in c.fetchall()]
#     print("📊 Database tables:", tables)
    
#     conn.close()
#     print("✅ Database fixed successfully!")

# if __name__ == '__main__':
#     fix_database()




import sqlite3
conn = sqlite3.connect('database/notes.db')
c = conn.cursor()
c.execute('DELETE FROM payments WHERE user_id = 1 AND note_id = 2 AND status = "success"')
conn.commit()
c.execute('SELECT * FROM payments WHERE user_id = 1 AND note_id = 2')  # Verify: should return empty
print(c.fetchall())  # []
conn.close()