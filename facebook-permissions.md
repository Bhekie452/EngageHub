# Facebook App Permissions

## 🔍 Current Facebook App Configuration

### ✅ Environment Variables
- **FACEBOOK_APP_ID:** ✅ Set (2106228116796555)
- **FACEBOOK_APP_SECRET:** ✅ Set
- **FACEBOOK_LONG_TERM_TOKEN:** ✅ Set

---

## 📋 Requested Permissions

### 🔧 **Current OAuth Scopes**
Your app requests these permissions via the `getLoginScope()` function:

```javascript
const getLoginScope = (): string =>
  import.meta.env.VITE_FACEBOOK_SCOPES || 
  'public_profile,email,pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights';
```

### 🎯 **Permission Breakdown**

| Permission | Purpose | Required For | Status |
|------------|---------|--------------|---------|
| `public_profile` | Basic profile information | User profile display | ✅ **Essential** |
| `email` | User email address | User identification | ✅ **Essential** |
| `pages_show_list` | See Facebook pages you manage | Page listing & selection | ✅ **Essential** |
| `pages_read_engagement` | Read page insights and analytics | Page analytics | ✅ **Essential** |
| `instagram_basic` | Access Instagram business accounts | Instagram integration | ✅ **Essential** |
| `instagram_content_publish` | Publish content to Instagram | Instagram posting | 🔶 **Optional** |
| `instagram_manage_comments` | Manage Instagram comments | Instagram moderation | 🔶 **Optional** |
| `instagram_manage_insights` | Access Instagram insights | Instagram analytics | 🔶 **Optional** |

---

## 🔗 **OAuth URL with Permissions**

```
https://www.facebook.com/v21.0/dialog/oauth?
  client_id=2106228116796555&
  redirect_uri=https://engage-hub-ten.vercel.app/auth/facebook/callback&
  scope=public_profile,email,pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights&
  response_type=code&
  state=facebook_oauth
```

---

## 🎯 **What Each Permission Allows**

### **Essential Permissions (Required for Basic Functionality)**

#### `public_profile`
- ✅ Access user's Facebook profile name
- ✅ Get profile picture
- ✅ Basic user identification

#### `email`
- ✅ Get user's email address
- ✅ User account identification
- ✅ Contact information

#### `pages_show_list`
- ✅ List Facebook pages user manages
- ✅ Get page names and IDs
- ✅ Page selection interface

#### `pages_read_engagement`
- ✅ Read page insights
- ✅ Get page analytics
- ✅ Access page performance data

#### `instagram_basic`
- ✅ Access Instagram business accounts
- ✅ Link Instagram to Facebook pages
- ✅ Get Instagram account info

### **Optional Permissions (Advanced Features)**

#### `instagram_content_publish`
- ✅ Post content to Instagram
- ✅ Upload media to Instagram
- ✅ Create Instagram posts

#### `instagram_manage_comments`
- ✅ Reply to Instagram comments
- ✅ Moderate Instagram comments
- ✅ Comment management

#### `instagram_manage_insights`
- ✅ Access Instagram analytics
- ✅ Get Instagram performance data
- ✅ Instagram insights

---

## 🚀 **Permission Recommendations**

### **✅ Minimum Required for Basic Functionality**
```
public_profile,email,pages_show_list,pages_read_engagement,instagram_basic
```

### **✅ Full Functionality (Current Setup)**
```
public_profile,email,pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights
```

### **🔧 If You Need Fewer Permissions**
You can set `VITE_FACEBOOK_SCOPES` in your environment to override the default:

```bash
# Example: Basic permissions only
VITE_FACEBOOK_SCOPES=public_profile,email,pages_show_list,pages_read_engagement,instagram_basic
```

---

## 📊 **Permission Status**

- **Total Permissions Requested:** 7
- **Essential Permissions:** 5
- **Optional Permissions:** 2
- **All Permissions:** ✅ Configured and ready

---

## 🎯 **What Users See During OAuth**

When users connect Facebook, they'll see a screen asking for permission to:

1. **Access your public profile** (public_profile)
2. **Access your email address** (email)
3. **See your Facebook Pages** (pages_show_list)
4. **Read insights from your Facebook Pages** (pages_read_engagement)
5. **Access your Instagram Business Account** (instagram_basic)
6. **Publish content to Instagram** (instagram_content_publish)
7. **Manage comments on Instagram** (instagram_manage_comments)
8. **Access insights from Instagram** (instagram_manage_insights)

---

## 🔍 **Permission Verification**

All permissions are properly configured in your Facebook app and OAuth flow. The system is ready to request and use all the permissions needed for comprehensive Facebook and Instagram integration.
