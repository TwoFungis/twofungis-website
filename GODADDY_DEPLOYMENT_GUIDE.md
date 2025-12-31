# 🚀 Two Fungis Ltd - GoDaddy Deployment Guide

## ✅ Your Site is Ready!

**What's Built:**
- ✅ 20+ location landing pages (SEO optimized)
- ✅ Portfolio with 10 watermarked photos
- ✅ Service areas section
- ✅ About page with founders info
- ✅ Contact section (email & phone)
- ✅ Full SEO optimization
- ✅ Mobile responsive
- ✅ 100% static (no backend needed)

---

## 📦 Step 1: Download Your Website Files

Your production-ready website is in: `/app/frontend/build/`

**All files you need:**
- index.html
- robots.txt
- static/ folder (contains CSS, JS, images)

---

## 🌐 Step 2: Upload to GoDaddy (Via File Manager)

### Option A: File Manager (Easiest - No Software Needed)

1. **Log into GoDaddy**
   - Go to https://godaddy.com
   - Click "Sign In"
   - Go to "My Products"

2. **Access File Manager**
   - Find your hosting plan for twofungis.ca
   - Click "Manage"
   - Click "File Manager" or "cPanel" → "File Manager"

3. **Navigate to Your Domain Folder**
   - Look for folder named: `public_html` or `twofungis.ca`
   - This is your website root directory

4. **Clear Existing Files (if any)**
   - Select all files in the folder
   - Delete them (backup first if needed)

5. **Upload Your Website**
   - Click "Upload" button
   - Select ALL files from `/app/frontend/build/` including:
     - index.html
     - robots.txt
     - asset-manifest.json
     - generate-sitemap.js
     - The entire `static` folder
   
   **IMPORTANT:** Make sure the `static` folder uploads with all its contents

6. **Set Permissions**
   - Select all files
   - Set permissions to 644 (usually default)
   - Folders should be 755

### Option B: FTP Upload (If You Prefer)

1. **Get FTP Credentials**
   - In GoDaddy hosting dashboard
   - Look for "FTP" or "FTP Accounts"
   - Note: hostname, username, password

2. **Use FTP Client**
   - Download FileZilla (free): https://filezilla-project.org/
   - Connect using your FTP credentials
   - Upload all files from `/app/frontend/build/` to `public_html/`

---

## 🔗 Step 3: Point Your Domain

### If Domain and Hosting are on Same GoDaddy Account:
**Likely already done!** Your domain should automatically work once files are uploaded.

### If You Need to Point Domain:

1. **Go to GoDaddy Domain Settings**
   - My Products → Domains
   - Click "DNS" next to twofungis.ca

2. **Update DNS Records**
   - Type: A Record
   - Name: @
   - Value: [Your hosting IP - find in hosting settings]
   - TTL: 1 Hour

   - Type: CNAME
   - Name: www
   - Value: @
   - TTL: 1 Hour

3. **Wait for Propagation**
   - Can take 1-48 hours (usually 1-4 hours)
   - Use https://dnschecker.org to check progress

---

## ✅ Step 4: Verify Your Site

1. **Visit Your Domain**
   - http://twofungis.ca
   - https://twofungis.ca (if SSL is set up)
   - http://www.twofungis.ca

2. **Test Key Pages**
   - Homepage: https://twofungis.ca
   - Vancouver: https://twofungis.ca/locations/vancouver
   - Victoria: https://twofungis.ca/locations/victoria
   - Contact info: Scroll to bottom

3. **Test Contact Links**
   - Click phone number (should open dialer on mobile)
   - Click email (should open email client)

---

## 🔒 Step 5: Enable SSL (HTTPS) - IMPORTANT!

**Why?** Google penalizes sites without HTTPS + customers trust secure sites more.

1. **In GoDaddy Dashboard**
   - Go to your hosting
   - Look for "SSL Certificate" or "Security"

2. **Free SSL Options:**
   - **Let's Encrypt** (Free forever)
     - Most GoDaddy plans include this
     - Click "Manage" → "SSL Certificates"
     - Select "Let's Encrypt" → Install
   
   - **GoDaddy SSL** (Paid ~$80/year)
     - Better for business sites
     - Shows company name in some browsers

3. **Force HTTPS**
   After SSL is installed, add this file to your site:

   **Create: `.htaccess` file in public_html/**
   ```
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

---

## 🎯 Step 6: Submit to Google

Once your site is live:

1. **Google Search Console**
   - Go to: https://search.google.com/search-console
   - Add property: twofungis.ca
   - Verify ownership (follow their steps)
   - Submit sitemap: https://twofungis.ca/sitemap.xml

2. **Google Business Profile**
   - Create/claim your business on Google Maps
   - Add your website link
   - Helps with local SEO

---

## 📊 Monitoring & Analytics (Optional but Recommended)

### Add Google Analytics (Free):

1. **Create Account**
   - Go to: https://analytics.google.com
   - Set up property for twofungis.ca

2. **Add Tracking Code**
   - You'll get a script like: `G-XXXXXXXXX`
   - Need to add to your site (I can help with this)

---

## 🆘 Troubleshooting

### Site Not Loading?
- **Check DNS**: Use dnschecker.org
- **Clear browser cache**: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- **Wait longer**: DNS can take up to 48 hours

### 404 Errors on Location Pages?
- **Fix**: Add `.htaccess` file with:
  ```
  <IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
  </IfModule>
  ```

### Images Not Loading?
- Make sure the `static` folder uploaded completely
- Check file permissions (should be 644)

### SSL Not Working?
- Allow 15-30 minutes after installation
- Clear browser cache
- Try incognito/private mode

---

## 📞 Need Help?

**GoDaddy Support:**
- Phone: 1-480-505-8877
- Live Chat: Available in your dashboard
- They're usually very helpful with file uploads and SSL

**What to Tell Them:**
"I need help uploading my static website files to my hosting and enabling SSL for twofungis.ca"

---

## 💰 Cost Breakdown

**What You're Paying:**
- Domain (twofungis.ca): ~$15-20/year (already paid)
- GoDaddy Hosting: ~$5-15/month (what you have)
- SSL Certificate: FREE (Let's Encrypt) or $80/year (GoDaddy SSL)

**Total: Just your existing GoDaddy hosting fee!**

**No Emergent fees, no backend fees, no database fees - 100% ownership!**

---

## ✅ Checklist

Before you start:
- [ ] Log into GoDaddy account
- [ ] Locate your hosting File Manager
- [ ] Have all build files ready
- [ ] Back up any existing site (if applicable)

After upload:
- [ ] Site loads at twofungis.ca
- [ ] All location pages work
- [ ] Contact links work (phone, email)
- [ ] SSL enabled (https://)
- [ ] Submitted to Google Search Console

---

## 🎉 You're Done!

Your professional website with 20 location pages and full SEO optimization will be live on YOUR domain with NO monthly fees (beyond your existing GoDaddy hosting).

**Questions? Let me know and I'll guide you through each step!**
