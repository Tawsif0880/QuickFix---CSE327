"""
Migration script to add job_id column to credit_transactions table
Run this script to add the job_id column for tracking emergency service fees
"""
import sqlite3
import os
from pathlib import Path

def migrate_add_job_id_to_credit_transactions():
    """Add job_id column to credit_transactions table in SQLite database"""
    
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
        
        # Check if job_id column already exists
        cursor.execute("PRAGMA table_info(credit_transactions)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'job_id' in columns:
            print("[OK] job_id column already exists in credit_transactions table")
            conn.close()
            return True
        
        print("Adding job_id column to credit_transactions table...")
        
        # Add the column (nullable, with foreign key constraint)
        cursor.execute("""
            ALTER TABLE credit_transactions 
            ADD COLUMN job_id INTEGER
        """)
        
        # Create index for better query performance
        try:
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_credit_transactions_job_id 
                ON credit_transactions(job_id)
            """)
        except sqlite3.OperationalError as e:
            # Index might already exist
            if "already exists" not in str(e).lower():
                print(f"Warning: Could not create index: {e}")
        
        # Commit changes
        conn.commit()
        
        # Verify the column was added
        cursor.execute("PRAGMA table_info(credit_transactions)")
        columns_after = [column[1] for column in cursor.fetchall()]
        
        if 'job_id' in columns_after:
            print("[OK] Successfully added job_id column to credit_transactions table")
            conn.close()
            return True
        else:
            print("[ERROR] Failed to add job_id column")
            conn.close()
            return False
    
    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Migration: Add job_id to credit_transactions")
    print("=" * 60)
    success = migrate_add_job_id_to_credit_transactions()
    if success:
        print("\n✅ Migration completed successfully!")
    else:
        print("\n❌ Migration failed. Please check the error messages above.")
        exit(1)
