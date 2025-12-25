"""
Migration: Add report_reason column to jobs table
Run: python migrate_add_report_reason.py
"""

import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'quickfix.db')
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(jobs)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'report_reason' not in columns:
        cursor.execute("ALTER TABLE jobs ADD COLUMN report_reason TEXT")
        print("[OK] Added 'report_reason' column to jobs table")
    else:
        print("[INFO] 'report_reason' column already exists")
    
    conn.commit()
    conn.close()
    print("[OK] Migration complete!")

if __name__ == '__main__':
    migrate()

