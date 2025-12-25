"""
Seed script to create dummy provider users for testing
Run this script to populate the database with sample providers
"""
from app import create_app
from extensions import db
from app.models.user import User
from app.models.provider import Provider
from app.auth.utils import hash_password

# Sample provider data
PROVIDERS_DATA = [
    {
        'email': 'john.plumber@example.com',
        'password': 'password123',
        'name': 'John Smith',
        'phone': '+1-555-0101',
        'category': 'plumber',
        'description': 'Licensed plumber with 15 years of experience. Specializing in residential and commercial plumbing, leak repairs, and pipe installations.',
        'service_area': 'Downtown, Midtown, Uptown',
        'hourly_rate': 75.00,
        'rating_avg': 4.8,
        'rating_count': 24
    },
    {
        'email': 'sarah.electrician@example.com',
        'password': 'password123',
        'name': 'Sarah Johnson',
        'phone': '+1-555-0102',
        'category': 'electrician',
        'description': 'Certified electrician providing safe and reliable electrical services. Expert in wiring, panel upgrades, and electrical repairs.',
        'service_area': 'Citywide',
        'hourly_rate': 85.00,
        'rating_avg': 4.9,
        'rating_count': 31
    },
    {
        'email': 'mike.carpenter@example.com',
        'password': 'password123',
        'name': 'Mike Williams',
        'phone': '+1-555-0103',
        'category': 'carpenter',
        'description': 'Master carpenter specializing in custom furniture, cabinetry, and home renovations. Quality craftsmanship guaranteed.',
        'service_area': 'Northside, Southside',
        'hourly_rate': 70.00,
        'rating_avg': 4.7,
        'rating_count': 18
    },
    {
        'email': 'lisa.painter@example.com',
        'password': 'password123',
        'name': 'Lisa Brown',
        'phone': '+1-555-0104',
        'category': 'painter',
        'description': 'Professional painter with expertise in interior and exterior painting. Using premium paints and materials.',
        'service_area': 'Eastside, Westside',
        'hourly_rate': 60.00,
        'rating_avg': 4.6,
        'rating_count': 22
    },
    {
        'email': 'david.mechanic@example.com',
        'password': 'password123',
        'name': 'David Miller',
        'phone': '+1-555-0105',
        'category': 'mechanic',
        'description': 'Experienced auto mechanic specializing in engine repairs, diagnostics, and maintenance. All makes and models.',
        'service_area': 'Citywide',
        'hourly_rate': 80.00,
        'rating_avg': 4.5,
        'rating_count': 15
    },
    {
        'email': 'emily.handyman@example.com',
        'password': 'password123',
        'name': 'Emily Davis',
        'phone': '+1-555-0106',
        'category': 'handyman',
        'description': 'Versatile handyman services for all your home repair needs. Quick response and quality workmanship.',
        'service_area': 'Downtown, Midtown',
        'hourly_rate': 65.00,
        'rating_avg': 4.4,
        'rating_count': 19
    },
    {
        'email': 'robert.cleaner@example.com',
        'password': 'password123',
        'name': 'Robert Wilson',
        'phone': '+1-555-0107',
        'category': 'cleaner',
        'description': 'Professional cleaning services for homes and offices. Deep cleaning, regular maintenance, and move-in/out cleaning.',
        'service_area': 'Citywide',
        'hourly_rate': 50.00,
        'rating_avg': 4.9,
        'rating_count': 28
    },
    {
        'email': 'jennifer.gardener@example.com',
        'password': 'password123',
        'name': 'Jennifer Martinez',
        'phone': '+1-555-0108',
        'category': 'gardener',
        'description': 'Landscape designer and gardener. Specializing in garden design, lawn care, and plant maintenance.',
        'service_area': 'Suburbs, Residential areas',
        'hourly_rate': 55.00,
        'rating_avg': 4.7,
        'rating_count': 16
    },
    {
        'email': 'james.plumber2@example.com',
        'password': 'password123',
        'name': 'James Anderson',
        'phone': '+1-555-0109',
        'category': 'plumber',
        'description': 'Emergency plumbing services available 24/7. Fast response time and competitive rates.',
        'service_area': 'Citywide',
        'hourly_rate': 90.00,
        'rating_avg': 4.3,
        'rating_count': 12
    },
    {
        'email': 'maria.electrician2@example.com',
        'password': 'password123',
        'name': 'Maria Garcia',
        'phone': '+1-555-0110',
        'category': 'electrician',
        'description': 'Residential and commercial electrical services. Licensed and insured. Free estimates available.',
        'service_area': 'Downtown, Business District',
        'hourly_rate': 95.00,
        'rating_avg': 4.8,
        'rating_count': 27
    },
    {
        'email': 'thomas.carpenter2@example.com',
        'password': 'password123',
        'name': 'Thomas Rodriguez',
        'phone': '+1-555-0111',
        'category': 'carpenter',
        'description': 'Custom woodworking and carpentry services. From small repairs to large construction projects.',
        'service_area': 'Northside, Eastside',
        'hourly_rate': 75.00,
        'rating_avg': 4.6,
        'rating_count': 14
    },
    {
        'email': 'patricia.painter2@example.com',
        'password': 'password123',
        'name': 'Patricia Lee',
        'phone': '+1-555-0112',
        'category': 'painter',
        'description': 'Interior painting specialist. Color consultation and premium finish work available.',
        'service_area': 'Residential areas',
        'hourly_rate': 65.00,
        'rating_avg': 4.5,
        'rating_count': 20
    }
]


def seed_providers():
    """Create dummy provider users"""
    app = create_app()
    
    with app.app_context():
        # Clear existing providers (optional - comment out if you want to keep existing data)
        # Provider.query.delete()
        # User.query.filter_by(role='provider').delete()
        # db.session.commit()
        
        created_count = 0
        skipped_count = 0
        
        for provider_data in PROVIDERS_DATA:
            # Check if user already exists
            existing_user = User.query.filter_by(email=provider_data['email']).first()
            if existing_user:
                print(f"Provider {provider_data['email']} already exists. Skipping...")
                skipped_count += 1
                continue
            
            try:
                # Create user
                password_hash = hash_password(provider_data['password'])
                user = User(
                    email=provider_data['email'],
                    password_hash=password_hash,
                    role='provider',
                    is_active=True
                )
                db.session.add(user)
                db.session.flush()  # Get user.id
                
                # Create provider profile
                provider = Provider(
                    user_id=user.id,
                    name=provider_data['name'],
                    phone=provider_data['phone'],
                    category=provider_data['category'],
                    description=provider_data['description'],
                    service_area=provider_data['service_area'],
                    hourly_rate=provider_data['hourly_rate'],
                    verified=True,  # Auto-verify for testing
                    rating_avg=provider_data.get('rating_avg', 0.0),
                    rating_count=provider_data.get('rating_count', 0),
                    is_available=True
                )
                db.session.add(provider)
                db.session.commit()
                
                print(f"✓ Created provider: {provider_data['name']} ({provider_data['category']})")
                created_count += 1
                
            except Exception as e:
                db.session.rollback()
                print(f"✗ Error creating provider {provider_data['email']}: {str(e)}")
        
        print(f"\n{'='*50}")
        print(f"Seed completed!")
        print(f"Created: {created_count} providers")
        print(f"Skipped: {skipped_count} providers (already exist)")
        print(f"{'='*50}")


if __name__ == '__main__':
    seed_providers()

