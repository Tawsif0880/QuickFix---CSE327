"""
Create test users with known credentials for testing
"""
from app import create_app
from extensions import db
from app.models.user import User
from app.models.customer import Customer
from app.models.provider import Provider
from app.auth.utils import hash_password
import os

app = create_app(os.getenv('FLASK_ENV', 'default'))

with app.app_context():
    # Check if test users already exist
    test_customer = User.query.filter_by(email='testcustomer@test.com').first()
    test_provider = User.query.filter_by(email='testprovider@test.com').first()
    test_admin = User.query.filter_by(email='testadmin@test.com').first()
    
    print('\n' + '='*70)
    print('🔐 TEST CREDENTIALS FOR LOGIN')
    print('='*70 + '\n')
    
    if not test_customer:
        print('Creating test customer user...')
        password = 'test123'
        customer = Customer(
            name='Test Customer',
            phone='+1-555-0000',
            address='123 Test Street, Test City',
            credits=100
        )
        user = User(
            email='testcustomer@test.com',
            password_hash=hash_password(password),
            role='customer',
            is_active=True
        )
        db.session.add(user)
        db.session.flush()
        customer.user_id = user.id
        db.session.add(customer)
        db.session.commit()
        print('✓ Test customer created')
    
    if not test_provider:
        print('Creating test provider user...')
        password = 'test123'
        provider = Provider(
            name='Test Provider',
            phone='+1-555-0001',
            category='plumber',
            description='Test provider for testing',
            service_area='Citywide',
            hourly_rate=75.00
        )
        user = User(
            email='testprovider@test.com',
            password_hash=hash_password(password),
            role='provider',
            is_active=True
        )
        db.session.add(user)
        db.session.flush()
        provider.user_id = user.id
        db.session.add(provider)
        db.session.commit()
        print('✓ Test provider created')
    
    if not test_admin:
        print('Creating test admin user...')
        password = 'test123'
        user = User(
            email='testadmin@test.com',
            password_hash=hash_password(password),
            role='admin',
            is_active=True
        )
        db.session.add(user)
        db.session.commit()
        print('✓ Test admin created')
    
    print('\n' + '='*70)
    print('📋 LOGIN CREDENTIALS')
    print('='*70 + '\n')
    
    print('🧑 CUSTOMER LOGIN:')
    print('   Email: testcustomer@test.com')
    print('   Password: test123')
    print('   URL: http://localhost:3000\n')
    
    print('👔 PROVIDER LOGIN:')
    print('   Email: testprovider@test.com')
    print('   Password: test123')
    print('   URL: http://localhost:3001\n')
    
    print('🔑 ADMIN LOGIN:')
    print('   Email: testadmin@test.com')
    print('   Password: test123')
    print('   URL: http://localhost:3002\n')
    
    print('='*70)
    print('\n✅ Test users are ready for login!\n')
