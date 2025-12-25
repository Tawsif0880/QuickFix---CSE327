import sqlite3

try:
    conn = sqlite3.connect('instance/quickfix.db')
    cursor = conn.cursor()
    
    print('\n' + '='*60)
    print('📋 USER CREDENTIALS')
    print('='*60)
    
    # Get all users
    cursor.execute("""
        SELECT u.id, u.email, u.password, u.user_type, 
               c.name as customer_name, p.name as provider_name
        FROM users u
        LEFT JOIN customers c ON u.id = c.user_id
        LEFT JOIN providers p ON u.id = p.user_id
    """)
    users = cursor.fetchall()
    
    if users:
        print('\n🔑 All Users in Database:\n')
        for i, user in enumerate(users, 1):
            user_id, email, password, user_type, customer_name, provider_name = user
            name = customer_name or provider_name or 'N/A'
            print(f'{i}. Email: {email}')
            print(f'   Password: {password}')
            print(f'   Type: {user_type}')
            print(f'   Name: {name}')
            print()
    
    conn.close()
except Exception as e:
    print(f'❌ Error: {e}')
