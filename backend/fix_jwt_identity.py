#!/usr/bin/env python3
"""
Script to fix JWT identity usage across all route files
Replaces User.query.get(current_user['id']) with proper handling
"""
import os
import re
from pathlib import Path

# Define the routes directory
ROUTES_DIR = Path("app").resolve()

def fix_file(file_path):
    """Fix a single file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Pattern to find: User.query.get(current_user['id'])
    # Replace with: User.query.get(get_user_id_from_jwt(current_user))
    
    content = re.sub(
        r"User\.query\.get\(current_user\['id'\]\)",
        "User.query.get(get_user_id_from_jwt(current_user))",
        content
    )
    
    # Add import if it doesn't exist
    if 'get_user_id_from_jwt' in content and 'from app.utils.decorators import' in content:
        # Check if it's already imported
        if 'get_user_id_from_jwt' not in content.split('from app.utils.decorators import')[1].split('\n')[0]:
            # Add to existing import
            content = re.sub(
                r'(from app\.utils\.decorators import .*)',
                lambda m: m.group(1).rstrip() + ', get_user_id_from_jwt' if 'get_user_id_from_jwt' not in m.group(1) else m.group(1),
                content
            )
    elif 'get_user_id_from_jwt' in content:
        # Add import if not present
        if 'from app.utils.decorators import' not in content:
            # Find first import and add after it
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith('from app'):
                    lines.insert(i+1, 'from app.utils.decorators import get_user_id_from_jwt')
                    content = '\n'.join(lines)
                    break
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Process all route files
route_files = [
    'app/ratings/routes.py',
    'app/providers/routes.py',
    'app/notifications/routes.py',
    'app/messaging/routes.py',
    'app/jobs/routes.py',
    'app/customers/routes.py',
    'app/bookings/routes.py',
    'app/credits/routes.py',
    'app/admin/routes.py',
]

fixed_count = 0
for route_file in route_files:
    file_path = Path(route_file)
    if file_path.exists():
        if fix_file(file_path):
            print(f"✅ Fixed: {route_file}")
            fixed_count += 1
        else:
            print(f"⏭️  No changes needed: {route_file}")
    else:
        print(f"⚠️  File not found: {route_file}")

print(f"\n✅ Fixed {fixed_count} files")
