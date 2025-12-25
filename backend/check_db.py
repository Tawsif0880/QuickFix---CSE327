import sqlite3
import os

try:
    db_path = 'instance/quickfix.db'
    if not os.path.exists(db_path):
        print('❌ Database file not found at', db_path)
    else:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        print('\n📊 Database Status:')
        if tables:
            print(f'\n✓ Found {len(tables)} tables:\n')
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
                count = cursor.fetchone()[0]
                print(f'  ✓ {table[0]}: {count} records')
        else:
            print('\n❌ No tables found - database is empty')
        
        # Check if providers table has data
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='provider'")
        if cursor.fetchone():
            cursor.execute("SELECT COUNT(*) FROM provider")
            provider_count = cursor.fetchone()[0]
            print(f'\n👤 Provider Count: {provider_count}')
            if provider_count > 0:
                print('✓ Database is SEEDED with provider data')
            else:
                print('❌ Provider table is empty - need to run seed_providers.py')
        
        conn.close()
except Exception as e:
    print(f'❌ Error: {e}')
