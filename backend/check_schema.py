import sqlite3

try:
    conn = sqlite3.connect('instance/quickfix.db')
    cursor = conn.cursor()
    
    print('\n' + '='*60)
    print('📋 USERS TABLE SCHEMA')
    print('='*60 + '\n')
    
    # Check the schema of users table
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    print('Columns in users table:')
    for col in columns:
        print(f'  - {col[1]} ({col[2]})')
    
    print('\n' + '='*60)
    print('📋 ALL USERS')
    print('='*60 + '\n')
    
    # Get all users
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    
    if users:
        for i, user in enumerate(users, 1):
            print(f'{i}. {user}')
    
    conn.close()
except Exception as e:
    print(f'❌ Error: {e}')
