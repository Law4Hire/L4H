# Site Startup Troubleshooting Guide

## 🚨 **Issue: Site Won't Load After TypeScript Fix**

The TypeScript error in `useAccessibilityI18n.ts` has been resolved, but if the site still won't load, here are the steps to troubleshoot:

## ✅ **Fixed Issues**
- ✅ TypeScript compilation error resolved
- ✅ Removed problematic `require()` call in browser environment
- ✅ Fixed deprecated CSS `clip` property
- ✅ Cleaned up unused parameter warnings

## 🔧 **Correct Startup Process**

### **For L4H Application:**
```bash
# Navigate to the L4H project directory
cd web/l4h

# Install dependencies (if needed)
npm install

# Start the development server
npm run dev
```

### **For Cannlaw Application:**
```bash
# Navigate to the Cannlaw project directory  
cd web/cannlaw

# Install dependencies (if needed)
npm install

# Start the development server
npm run dev
```

### **For Shared UI Development:**
```bash
# Navigate to the shared-ui directory
cd web/shared-ui

# Build the shared components
npm run build

# Or run in watch mode for development
npm run dev
```

## 🔍 **Common Issues & Solutions**

### **1. "Cannot find module" errors**
```bash
# Rebuild shared-ui package
cd web/shared-ui
npm run build

# Then restart your main application
cd ../l4h  # or ../cannlaw
npm run dev
```

### **2. Translation loading errors**
The translation audit revealed that many translation files contain English text instead of proper translations. This might cause runtime errors.

**Temporary fix:**
- The system will fall back to English translations
- Check browser console for specific translation errors

**Long-term fix:**
- Run the translation audit: `node scripts/translation-audit.js`
- Replace English text in non-English translation files

### **3. i18n initialization errors**
If you see i18n-related errors in the console:

```bash
# Check if translation files exist
ls web/l4h/public/locales/en-US/
ls web/shared-ui/public/locales/shared/en-US/

# Verify the files contain valid JSON
cat web/l4h/public/locales/en-US/common.json
```

### **4. Port conflicts**
If port 5173 is already in use:

```bash
# Kill existing processes on port 5173
npx kill-port 5173

# Or specify a different port
npm run dev -- --port 5174
```

## 🌐 **Expected Behavior After Fix**

1. **TypeScript compilation** should complete without errors
2. **Development server** should start successfully
3. **Browser console** should show i18n initialization messages
4. **Language switching** should work (though translations may be in English)
5. **RTL languages** should flip the layout correctly

## 📋 **Verification Steps**

1. **Check TypeScript compilation:**
   ```bash
   cd web/shared-ui
   npm run build  # Should complete without errors
   ```

2. **Start the development server:**
   ```bash
   cd web/l4h
   npm run dev    # Should start on http://localhost:5173
   ```

3. **Open browser and check console:**
   - No TypeScript errors
   - i18n initialization messages
   - Translation loading messages (may show fallback warnings)

4. **Test language switching:**
   - Language selector should appear
   - Switching languages should work
   - RTL languages (Arabic, Urdu) should flip layout

## 🚨 **If Site Still Won't Load**

1. **Check the browser console** for specific error messages
2. **Check the terminal** where you ran `npm run dev` for server errors
3. **Verify all dependencies are installed:**
   ```bash
   cd web/l4h
   npm install
   cd ../shared-ui  
   npm install
   ```

4. **Clear browser cache and restart:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear localStorage/sessionStorage
   - Restart the dev server

## 📞 **Next Steps**

If you're still experiencing issues, please share:
1. The exact error message from browser console
2. The terminal output from `npm run dev`
3. Which directory you're running the command from

The TypeScript error has been resolved, so any remaining issues are likely related to:
- Running commands from wrong directory
- Missing dependencies
- Translation file issues (non-blocking)
- Port conflicts