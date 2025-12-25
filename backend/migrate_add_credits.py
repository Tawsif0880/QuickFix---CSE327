"""
Migration script to add credits column to customers table
Run this script to add the credits column with default value 35 to existing customers
"""
import sqlite3
import os
from pathlib import Path

def migrate_add_credits():
    """Add credits column to customers table in SQLite database"""
    
    # Get database path
    base_dir = Path(__file__).parent
    db_path = base_dir / 'instance' / 'quickfix.db'
    
    if not db_path.exists():
        print(f"Error: Database not found at {db_path}")
        print("Please ensure the database exists before running migration.")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check if credits column already exists
        cursor.execute("PRAGMA table_info(customers)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'credits' in columns:
            print("[OK] Credits column already exists in customers table")
            conn.close()
            return True
        
        print("Adding credits column to customers table...")
        
        # SQLite doesn't support adding a column with a default value that applies to existing rows
        # So we need to:
        # 1. Add the column (nullable first)
        # 2. Update existing rows to have default value 35
        # 3. Make it NOT NULL (SQLite limitation - we'll keep it nullable in schema but enforce in app)
        
        # Step 1: Add the column
        cursor.execute("""
            ALTER TABLE customers 
            ADD COLUMN credits INTEGER DEFAULT 35
        """)
        
        # Step 2: Update existing rows that might be NULL (though DEFAULT should handle this)
        cursor.execute("""
            UPDATE customers 
            SET credits = 35 
            WHERE credits IS NULL
        """)
        
        # Commit changes
        conn.commit()
        
        # Verify the column was added
        cursor.execute("PRAGMA table_info(customers)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'credits' in columns:
            # Check how many customers were updated
            cursor.execute("SELECT COUNT(*) FROM customers")
            count = cursor.fetchone()[0]
            print(f"[OK] Successfully added credits column to customers table")
            print(f"[OK] {count} customer(s) now have credits column with default value 35")
            conn.close()
            return True
        else:
            print("[ERROR] Column was not added successfully")
            conn.close()
            return False
            
    except sqlite3.Error as e:
        print(f"[ERROR] Database error: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        if conn:
            conn.close()
        return False

if __name__ == '__main__':
    print("=" * 50)
    print("Migration: Add credits column to customers table")
    print("=" * 50)
    print()
    
    success = migrate_add_credits()
    
    print()
    if success:
        print("=" * 50)
        print("Migration completed successfully!")
        print("=" * 50)
    else:
        print("=" * 50)
        print("Migration failed. Please check the errors above.")
        print("=" * 50)

