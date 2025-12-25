"""
Generate PWA Icons for QuickFix Apps
Creates placeholder SVG icons that can be converted to PNG
"""

def create_svg_icon(color, letter, filename):
    svg_content = f'''<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="{color}" rx="64"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="white">
    {letter}
  </text>
</svg>'''
    
    with open(filename, 'w') as f:
        f.write(svg_content)
    print(f"✅ Created {filename}")

# Customer PWA - Purple/Blue
print("\n📱 Creating Customer PWA Icons...")
create_svg_icon("#667eea", "C", "customer-pwa/public/icon.svg")

# Provider PWA - Green
print("\n📱 Creating Provider PWA Icons...")
create_svg_icon("#10b981", "P", "provider-pwa/public/icon.svg")

# Admin Dashboard - Red
print("\n📱 Creating Admin Dashboard Icons...")
create_svg_icon("#ef4444", "A", "admin-dashboard/public/icon.svg")

print("\n" + "="*60)
print("✅ SVG Icons Created!")
print("="*60)
print("\n📋 Next Steps:")
print("1. Convert SVG to PNG using online tool or ImageMagick")
print("2. Create these sizes: 64x64, 192x192, 512x512")
print("3. Or use https://realfavicongenerator.net/")
print("\nFor now, the apps will work without icons.")
print("Icons will show a default browser icon until you add PNGs.")
print("="*60)
