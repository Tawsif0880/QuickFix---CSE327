"""
Migration script to add customer_message_count column to conversations table
Run this script to add the customer_message_count column with default value 0 to existing conversations
"""
import sqlite3
import os
from pathlib import Path

def migrate_add_customer_message_count():
    """Add customer_message_count column to conversations table in SQLite database"""
    
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
        
        # Check if customer_message_count column already exists
        cursor.execute("PRAGMA table_info(conversations)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'customer_message_count' in columns:
            print("[OK] customer_message_count column already exists in conversations table")
            # Update any NULL values to default
            cursor.execute("""
                UPDATE conversations 
                SET customer_message_count = 0 
                WHERE customer_message_count IS NULL
            """)
            conn.commit()
            conn.close()
            return True
        
        print("Adding customer_message_count column to conversations table...")
        
        # Add the column
        cursor.execute("""
            ALTER TABLE conversations 
            ADD COLUMN customer_message_count INTEGER DEFAULT 0
        """)
        
        # Update existing rows that might be NULL (though DEFAULT should handle this)
        cursor.execute("""
            UPDATE conversations 
            SET customer_message_count = 0 
            WHERE customer_message_count IS NULL
        """)
        
        # Commit changes
        conn.commit()
        
        # Verify the column was added
        cursor.execute("PRAGMA table_info(conversations)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'customer_message_count' in columns:
            # Check how many conversations exist
            cursor.execute("SELECT COUNT(*) FROM conversations")
            count = cursor.fetchone()[0]
            print(f"[OK] Successfully added customer_message_count column to conversations table")
            print(f"[OK] {count} conversation(s) now have customer_message_count column with default value 0")
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
    print("=" * 60)
    print("Migration: Add customer_message_count column to conversations table")
    print("=" * 60)
    print()
    
    success = migrate_add_customer_message_count()
    
    print()
    if success:
        print("=" * 60)
        print("Migration completed successfully!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Restart the backend server")
        print("2. Verify provider credits are awarded correctly every 3 customer messages")
    else:
        print("=" * 60)
        print("Migration failed. Please check the errors above.")
        print("=" * 60)

