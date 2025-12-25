# 🚀 Quick Start - Test PWA Installation

## Test Customer PWA (Recommended for first test)

```powershell
cd "f:\Work\tawsif\Quick Fix\customer-pwa"
npm run dev
```

Then open: http://localhost:3000

---

## What to Look For:

### 1. **Install Prompt (Bottom of Screen)**
- Should see a white card at bottom
- "📱 Install QuickFix"
- Click "Install" button
- Native install dialog appears

### 2. **Browser Install Button**
- Chrome/Edge: Look for ⊕ icon in address bar
- Click to install

### 3. **Service Worker (DevTools)**
- Open DevTools (F12)
- Go to "Application" tab
- Click "Service Workers"
- Should see "activated and running"

### 4. **Manifest (DevTools)**
- Still in "Application" tab
- Click "Manifest"
- Should show app details
- Check icon previews

### 5. **PWA Score (Lighthouse)**
- DevTools → Lighthouse tab
- Select "Progressive Web App"
- Click "Analyze page load"
- Should score 90+

---

## Testing Installation:

### Desktop Install:
1. Click install button
2. App opens in new window (no browser UI)
3. Pin to taskbar if you want
4. Launch from start menu or taskbar

### Uninstall:
- Right-click app window title bar
- Select "Uninstall QuickFix..."
- Confirm

---

## Test Offline Mode:

1. Install the app
2. Open DevTools → Application → Service Workers
3. Check "Offline" checkbox
4. Refresh page
5. App should still load! ✅

---

## Quick Build Test:

```powershell
# Build production version
npm run build

# Preview production build
npm run preview
```

Production build will be in `dist/` folder.

---

## Repeat for Other Apps:

**Provider PWA:**
```powershell
cd "f:\Work\tawsif\Quick Fix\provider-pwa"
npm run dev
# Opens at http://localhost:3001
```

**Admin Dashboard:**
```powershell
cd "f:\Work\tawsif\Quick Fix\admin-dashboard"
npm run dev
# Opens at http://localhost:3002
```

---

## 🎉 Success Checklist:

- ✅ Install prompt appears
- ✅ Can install app
- ✅ App opens standalone
- ✅ Service worker active
- ✅ Works offline
- ✅ PWA score > 90

---

## Troubleshooting:

**Install button not showing?**
- Hard refresh (Ctrl + Shift + R)
- Clear cache
- Try incognito mode

**Service worker not registering?**
- Check console for errors
- Make sure you're on http://localhost (not IP)
- Restart dev server

**Want to test on phone?**
- Use `npm run dev -- --host`
- Find your IP: `ipconfig` (Windows)
- Visit from phone: `http://YOUR_IP:3000`
- Make sure phone and PC on same WiFi

---

All apps are ready to test! 🚀
