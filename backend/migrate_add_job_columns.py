"""
Migration script to add offered_price and preferred_date columns to jobs table
Run this script to add the new columns to existing jobs table
"""
import sqlite3
import os
from pathlib import Path

def migrate_add_job_columns():
    """Add offered_price and preferred_date columns to jobs table in SQLite database"""
    
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
        
        # Check existing columns
        cursor.execute("PRAGMA table_info(jobs)")
        columns = {column[1]: column for column in cursor.fetchall()}
        
        columns_added = []
        
        # Add offered_price column if it doesn't exist
        if 'offered_price' not in columns:
            print("Adding offered_price column to jobs table...")
            try:
                cursor.execute("""
                    ALTER TABLE jobs 
                    ADD COLUMN offered_price REAL
                """)
                columns_added.append('offered_price')
                print("[OK] Successfully added offered_price column (REAL, nullable)")
            except sqlite3.OperationalError as e:
                print(f"[ERROR] Failed to add offered_price column: {e}")
                conn.rollback()
                conn.close()
                return False
        else:
            print("[OK] offered_price column already exists in jobs table")
        
        # Add preferred_date column if it doesn't exist
        if 'preferred_date' not in columns:
            print("Adding preferred_date column to jobs table...")
            try:
                # SQLite stores DateTime as TEXT, SQLAlchemy handles conversion
                cursor.execute("""
                    ALTER TABLE jobs 
                    ADD COLUMN preferred_date TEXT
                """)
                columns_added.append('preferred_date')
                print("[OK] Successfully added preferred_date column (TEXT, nullable)")
            except sqlite3.OperationalError as e:
                print(f"[ERROR] Failed to add preferred_date column: {e}")
                conn.rollback()
                conn.close()
                return False
        else:
            print("[OK] preferred_date column already exists in jobs table")
        
        # Commit changes if any columns were added
        if columns_added:
            conn.commit()
            print(f"\n[OK] Successfully added {len(columns_added)} column(s) to jobs table")
        else:
            print("\n[OK] All required columns already exist. No changes needed.")
        
        # Verify the columns were added
        cursor.execute("PRAGMA table_info(jobs)")
        columns_after = {column[1]: column for column in cursor.fetchall()}
        
        if 'offered_price' in columns_after and 'preferred_date' in columns_after:
            # Check how many jobs exist
            cursor.execute("SELECT COUNT(*) FROM jobs")
            count = cursor.fetchone()[0]
            print(f"[OK] Verified: jobs table now has {len(columns_after)} columns")
            print(f"[OK] {count} job(s) in database (existing data preserved)")
            conn.close()
            return True
        else:
            print("[ERROR] Column verification failed")
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
    print("Migration: Add offered_price and preferred_date to jobs table")
    print("=" * 60)
    print()
    
    success = migrate_add_job_columns()
    
    print()
    if success:
        print("=" * 60)
        print("Migration completed successfully!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Restart the backend server")
        print("2. Verify job creation works without errors")
    else:
        print("=" * 60)
        print("Migration failed. Please check the errors above.")
        print("=" * 60)
