"""
Migration script to add emergency_active to providers and is_emergency to jobs
Run this script to add the new columns to existing tables
"""
import sqlite3
import os
from pathlib import Path

def migrate_add_emergency_fields():
    """Add emergency_active to providers and is_emergency to jobs tables"""
    
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
        
        # Check and add emergency_active to providers
        cursor.execute("PRAGMA table_info(providers)")
        provider_columns = [column[1] for column in cursor.fetchall()]
        
        if 'emergency_active' not in provider_columns:
            print("Adding emergency_active column to providers table...")
            cursor.execute("""
                ALTER TABLE providers 
                ADD COLUMN emergency_active INTEGER DEFAULT 0
            """)
            # Update existing rows to have default value 0 (False)
            cursor.execute("""
                UPDATE providers 
                SET emergency_active = 0 
                WHERE emergency_active IS NULL
            """)
            print("[OK] Successfully added emergency_active column to providers table")
        else:
            print("[OK] emergency_active column already exists in providers table")
        
        # Check and add is_emergency to jobs
        cursor.execute("PRAGMA table_info(jobs)")
        job_columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_emergency' not in job_columns:
            print("Adding is_emergency column to jobs table...")
            cursor.execute("""
                ALTER TABLE jobs 
                ADD COLUMN is_emergency INTEGER DEFAULT 0
            """)
            # Update existing rows to have default value 0 (False)
            cursor.execute("""
                UPDATE jobs 
                SET is_emergency = 0 
                WHERE is_emergency IS NULL
            """)
            print("[OK] Successfully added is_emergency column to jobs table")
        else:
            print("[OK] is_emergency column already exists in jobs table")
        
        # Create indexes for better query performance
        try:
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_providers_emergency_active 
                ON providers(emergency_active)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_jobs_is_emergency 
                ON jobs(is_emergency)
            """)
        except sqlite3.OperationalError as e:
            if "already exists" not in str(e).lower():
                print(f"Warning: Could not create indexes: {e}")
        
        # Commit changes
        conn.commit()
        
        # Verify the columns were added
        cursor.execute("PRAGMA table_info(providers)")
        provider_columns_after = [column[1] for column in cursor.fetchall()]
        cursor.execute("PRAGMA table_info(jobs)")
        job_columns_after = [column[1] for column in cursor.fetchall()]
        
        success = True
        if 'emergency_active' not in provider_columns_after:
            print("[ERROR] Failed to add emergency_active column")
            success = False
        if 'is_emergency' not in job_columns_after:
            print("[ERROR] Failed to add is_emergency column")
            success = False
        
        conn.close()
        return success
    
    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Migration: Add emergency fields to providers and jobs")
    print("=" * 60)
    success = migrate_add_emergency_fields()
    if success:
        print("\n✅ Migration completed successfully!")
    else:
        print("\n❌ Migration failed. Please check the error messages above.")
        exit(1)
