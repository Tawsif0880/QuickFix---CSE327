"""
Migration script to add credits column to providers table
Run this script to add the credits column with default value 20.0 to existing providers
"""
import sqlite3
import os
from pathlib import Path

def migrate_add_provider_credits():
    """Add credits column to providers table in SQLite database"""
    
    # Get database path
    base_dir = Path(__file__).parent
    db_path = base_dir / 'instance' / 'quickfix.db'
    
    # Also check if database is in current directory (some setups)
    if not db_path.exists():
        db_path = base_dir / 'quickfix.db'
    
    if not db_path.exists():
        print(f"Error: Database not found at {db_path}")
        print("Please ensure the database exists before running migration.")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check if credits column already exists
        cursor.execute("PRAGMA table_info(providers)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'credits' in columns:
            print("[OK] Credits column already exists in providers table")
            # Update any NULL values to default
            cursor.execute("""
                UPDATE providers 
                SET credits = 20.0 
                WHERE credits IS NULL
            """)
            conn.commit()
            conn.close()
            return True
        
        print("Adding credits column to providers table...")
        
        # SQLite doesn't support adding a column with a default value that applies to existing rows
        # So we need to:
        # 1. Add the column (with default)
        # 2. Update existing rows to have default value 20.0
        
        # Step 1: Add the column
        cursor.execute("""
            ALTER TABLE providers 
            ADD COLUMN credits REAL DEFAULT 20.0
        """)
        
        # Step 2: Update existing rows that might be NULL (though DEFAULT should handle this)
        cursor.execute("""
            UPDATE providers 
            SET credits = 20.0 
            WHERE credits IS NULL
        """)
        
        # Commit changes
        conn.commit()
        
        # Verify the column was added
        cursor.execute("PRAGMA table_info(providers)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'credits' in columns:
            # Check how many providers were updated
            cursor.execute("SELECT COUNT(*) FROM providers")
            count = cursor.fetchone()[0]
            print(f"[OK] Successfully added credits column to providers table")
            print(f"[OK] {count} provider(s) now have credits column with default value 20.0")
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
    print("Migration: Add credits column to providers table")
    print("=" * 50)
    print()
    
    success = migrate_add_provider_credits()
    
    print()
    if success:
        print("=" * 50)
        print("Migration completed successfully!")
        print("=" * 50)
        print("\nNext steps:")
        print("1. Restart the backend server")
        print("2. Verify provider credits are displayed correctly")
    else:
        print("=" * 50)
        print("Migration failed. Please check the errors above.")
        print("=" * 50)

