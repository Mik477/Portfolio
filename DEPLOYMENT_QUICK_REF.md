# 🎯 Quick Deployment Reference

## Build Command
```bash
npm run build
```

## Upload to IONOS
Upload **contents** of `build/` folder (not the folder itself) to web root via FTP.

## Required .htaccess
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /$1.html [L]
ErrorDocument 404 /404.html
```

## Test URLs
- Root: `https://your-domain.com/` → Should redirect to `/en` or `/de`
- English: `https://your-domain.com/en`
- German: `https://your-domain.com/de`

## How It Works
1. **New visitor** (no cookie):
   - API detects country from IP
   - DE/AT/CH/LI/LU → `/de`
   - Others → `/en`
   - Cookie saved

2. **Returning visitor** (has cookie):
   - Instant redirect using cookie
   - No API call

3. **Language switcher**:
   - User can override
   - Cookie updated

## Cookie Details
- **Name**: `locale`
- **Values**: `en` or `de`
- **Duration**: 1 year

## Troubleshooting
- **Stuck on loading**: Clear cookies, check console
- **Always English**: Clear `locale` cookie
- **404 on refresh**: Add .htaccess
- **No CSS/JS**: Verify `_app/` folder uploaded

## Files Changed for IONOS
✅ `src/routes/+page.svelte` - Client-side IP detection  
✅ `svelte.config.js` - Static adapter, prerender entries  
✅ `src/routes/+page.server.ts` - Prerender enabled  
❌ `src/hooks.server.ts` - Removed (not needed for static)  

## Build Output
```
build/
├── index.html       ← Root (redirects)
├── en/              ← English
├── de/              ← German
├── _app/            ← Assets
├── images/          ← Images
└── fonts/           ← Fonts
```

## Ready to Deploy! 🚀
Your portfolio is configured for IONOS with full IP geolocation.
