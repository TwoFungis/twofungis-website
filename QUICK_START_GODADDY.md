# 🚀 QUICK START: Upload to GoDaddy in 5 Minutes

## What You Have:
✅ **File:** `twofungis-website-complete.zip` (584 KB)
✅ **Contains:** Your complete website ready to upload

---

## STEP 1: Get Your Files

**Your website files are at:**
```
/app/frontend/build/
```

**Or download the ZIP:**
```
/tmp/twofungis-website-complete.zip
```

---

## STEP 2: Login to GoDaddy

1. Go to: **https://godaddy.com**
2. Click: **"Sign In"**
3. Click: **"My Products"**
4. Find your hosting for **twofungis.ca**
5. Click: **"Manage"** or **"cPanel"**

---

## STEP 3: Open File Manager

1. Look for: **"File Manager"** button
2. Click it
3. You'll see folders like:
   - `public_html` ← **THIS IS WHERE YOU UPLOAD**
   - `www`
   - Other folders

4. Click on **`public_html`**

---

## STEP 4: Clean the Folder

**If there are existing files:**
1. Select all files (checkbox at top)
2. Click **"Delete"** or trash icon
3. Confirm deletion

**If folder is empty:**
- Perfect! Continue to next step

---

## STEP 5: Upload Your Website

### Method A: Upload ZIP (Easier)

1. Click **"Upload"** button
2. Select: `twofungis-website-complete.zip`
3. Wait for upload to finish
4. Right-click the ZIP file
5. Click **"Extract"** or **"Unzip"**
6. Files will extract to the folder
7. Delete the ZIP file (optional, saves space)

### Method B: Upload Individual Files

1. Click **"Upload"** button
2. Navigate to `/app/frontend/build/` on your computer
3. Select ALL files:
   - index.html
   - robots.txt
   - .htaccess
   - asset-manifest.json
   - generate-sitemap.js
   - **static folder** (entire folder)
4. Click **"Upload"**
5. Wait for completion

---

## STEP 6: Verify Files

**Your public_html should now contain:**
```
public_html/
  ├── index.html
  ├── robots.txt
  ├── .htaccess
  ├── asset-manifest.json
  ├── generate-sitemap.js
  └── static/
      ├── css/
      └── js/
```

✅ If you see this structure, **you're done with upload!**

---

## STEP 7: Check Your Website

1. Open browser
2. Go to: **http://twofungis.ca**
3. Your site should load!

**Test these pages:**
- Homepage: http://twofungis.ca
- Vancouver: http://twofungis.ca/locations/vancouver
- Victoria: http://twofungis.ca/locations/victoria
- Click phone number (778-268-4920)
- Click email (inbox@twofungis.ca)

---

## STEP 8: Enable SSL (Make it HTTPS)

**Why?** Google requires it, customers trust it more.

1. In GoDaddy dashboard
2. Look for **"SSL Certificates"** or **"Security"**
3. Click **"Manage SSL"**
4. Choose **"Let's Encrypt"** (FREE)
5. Click **"Install"**
6. Wait 10-15 minutes

**Then test:**
- **https://twofungis.ca** (with 's')
- Should work without warning

---

## TROUBLESHOOTING

### ❌ Site shows "404" or "Not Found"
**Fix:**
- Make sure `.htaccess` file uploaded
- Check that `index.html` is in `public_html`
- Contact GoDaddy support

### ❌ Location pages don't work (shows 404)
**Fix:**
- Upload the `.htaccess` file
- Make sure mod_rewrite is enabled (ask GoDaddy support)

### ❌ Images not showing
**Fix:**
- Make sure `static` folder uploaded completely
- Check folder permissions (should be 755)

### ❌ Still showing old website
**Fix:**
- Clear browser cache (Ctrl+F5)
- Try different browser or incognito mode
- Check DNS propagation: https://dnschecker.org

---

## 🎉 YOU'RE LIVE!

Your professional website is now live at:
**https://twofungis.ca**

**What you have:**
✅ 20+ location landing pages
✅ Full SEO optimization  
✅ Portfolio with your photos
✅ Contact information
✅ Mobile responsive
✅ Fast loading
✅ **100% YOUR ownership**

**What you pay:**
💰 Only your existing GoDaddy hosting (~$5-15/month)
✅ No Emergent fees
✅ No backend fees
✅ No database fees

---

## Need Help?

**GoDaddy Support:**
📞 **1-480-505-8877**
💬 **Live Chat** in your dashboard

**What to say:**
"I'm uploading my website files to public_html and need help with File Manager"

---

**Want me to guide you through it live? Just let me know what step you're on!**
