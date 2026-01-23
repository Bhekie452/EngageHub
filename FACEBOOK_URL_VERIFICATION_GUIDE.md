# Facebook URL Verification Guide

## 🔍 What's Needed for URL Verification

Facebook requires that your URLs are **publicly accessible** and contain the **correct content**. Here's what you need to do:

## ✅ Step-by-Step Verification Process

### 1. **Create Public Pages**

You need to create actual pages at these URLs:

- **Terms of Service:** `https://engagehub.com/terms`
- **Privacy Policy:** `https://engagehub.com/privacy`
- **Web/Desktop URL:** `https://engagehub.com` (your main website)

### 2. **Verify URLs are Publicly Accessible**

Test each URL in an **incognito/private browser window** (not logged in):

```bash
# Test URLs
https://engagehub.com/terms
https://engagehub.com/privacy
https://engagehub.com
```

✅ **All URLs must:**
- Return HTTP 200 status (not 404, 403, or 500)
- Be accessible without login
- Load within 5 seconds
- Use HTTPS (not HTTP)

### 3. **Add Required Meta Tags**

Each page should include proper meta tags. Add these to your HTML `<head>`:

#### For Terms of Service (`/terms`):
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - EngageHub</title>
    <meta name="description" content="Terms of Service for EngageHub">
    <meta name="robots" content="index, follow">
</head>
<body>
    <h1>Terms of Service</h1>
    <!-- Your terms content here -->
</body>
</html>
```

#### For Privacy Policy (`/privacy`):
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - EngageHub</title>
    <meta name="description" content="Privacy Policy for EngageHub">
    <meta name="robots" content="index, follow">
</head>
<body>
    <h1>Privacy Policy</h1>
    <!-- Your privacy policy content here -->
</body>
</html>
```

### 4. **Facebook Domain Verification (Optional but Recommended)**

For better verification, you can add Facebook's domain verification meta tag:

1. Go to [Facebook Business Settings](https://business.facebook.com/settings)
2. Go to **Brand Safety** → **Domains**
3. Add your domain: `engagehub.com`
4. Facebook will give you a meta tag like:
   ```html
   <meta name="facebook-domain-verification" content="YOUR_VERIFICATION_CODE" />
   ```
5. Add this meta tag to your main website's `<head>` (the Web/Desktop URL)

### 5. **Quick Fix: Create Simple Static Pages**

If you don't have these pages yet, create simple HTML pages:

#### `/public/terms.html` or `/terms/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - EngageHub</title>
</head>
<body>
    <div style="max-width: 800px; margin: 50px auto; padding: 20px;">
        <h1>Terms of Service</h1>
        <p><strong>Last Updated:</strong> [Date]</p>
        <p>By using EngageHub, you agree to these terms...</p>
        <!-- Add your actual terms content -->
    </div>
</body>
</html>
```

#### `/public/privacy.html` or `/privacy/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - EngageHub</title>
</head>
<body>
    <div style="max-width: 800px; margin: 50px auto; padding: 20px;">
        <h1>Privacy Policy</h1>
        <p><strong>Last Updated:</strong> [Date]</p>
        <p>EngageHub respects your privacy...</p>
        <!-- Add your actual privacy policy content -->
    </div>
</body>
</html>
```

### 6. **Verify in Facebook App Settings**

After creating the pages:

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Select your app
3. Go to **Settings** → **Basic**
4. Scroll to **Privacy Policy URL** and **Terms of Service URL**
5. Click **"Verify URL"** or **"Check"** button next to each URL
6. Facebook will test if the URL is accessible

### 7. **Common Issues & Fixes**

#### ❌ "URL is not verified"
**Causes:**
- URL returns 404 (page doesn't exist)
- URL requires login/authentication
- URL redirects to another page
- URL times out (>5 seconds)
- URL uses HTTP instead of HTTPS

**Fixes:**
- ✅ Make sure pages exist and are publicly accessible
- ✅ Test URLs in incognito mode
- ✅ Use HTTPS (not HTTP)
- ✅ Don't redirect these URLs
- ✅ Ensure pages load quickly

#### ❌ "URL properties not verified"
**Causes:**
- Page doesn't have proper HTML structure
- Page is blocked by robots.txt
- Page has security headers blocking Facebook's crawler

**Fixes:**
- ✅ Add proper HTML structure (DOCTYPE, head, body)
- ✅ Check `robots.txt` allows Facebook's crawler
- ✅ Remove security headers that block crawlers
- ✅ Add meta tags as shown above

### 8. **Testing Your URLs**

Use these tools to test:

```bash
# Test if URL is accessible
curl -I https://engagehub.com/terms
curl -I https://engagehub.com/privacy
curl -I https://engagehub.com

# Should return: HTTP/2 200
```

Or use online tools:
- [HTTP Status Checker](https://httpstatus.io/)
- [SSL Labs](https://www.ssllabs.com/ssltest/) (for HTTPS)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (to see what Facebook sees)

### 9. **After Verification**

Once URLs are verified:
1. ✅ Green checkmark appears next to each URL
2. ✅ You can proceed with App Review
3. ✅ No more red error messages

## 🚀 Quick Checklist

- [ ] Created `/terms` page with actual content
- [ ] Created `/privacy` page with actual content
- [ ] Main website (`https://engagehub.com`) is live
- [ ] All URLs use HTTPS (not HTTP)
- [ ] All URLs are publicly accessible (test in incognito)
- [ ] All URLs return HTTP 200 status
- [ ] Pages have proper HTML structure
- [ ] Clicked "Verify" button in Facebook App Settings
- [ ] Green checkmarks appear next to URLs

## 📝 Notes

- **For Development/Testing:** You can use placeholder content initially, but for production App Review, you'll need actual Terms of Service and Privacy Policy content.

- **Content Requirements:** 
  - Terms of Service should explain user rights and responsibilities
  - Privacy Policy should explain data collection and usage (required for GDPR compliance)

- **Domain Verification:** While not strictly required, adding Facebook's domain verification meta tag helps with the verification process.

## 🔗 Resources

- [Facebook App Review Requirements](https://developers.facebook.com/docs/app-review)
- [Facebook Domain Verification](https://www.facebook.com/business/help/2058515294227817)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
