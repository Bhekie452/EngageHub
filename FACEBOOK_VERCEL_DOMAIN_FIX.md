# Fix: "The domain of this URL isn't included in the app's domains"

When connecting Facebook on your Vercel app (`https://engage-hub-ten.vercel.app`), you must add your app’s domain in the Facebook Developer Console. Do this in two places.

---

## 1. App Domains

1. Go to [developers.facebook.com](https://developers.facebook.com) → **My Apps** → your app.
2. Open **Settings** → **Basic**.
3. Find **App Domains**.
4. Add:
   - `engage-hub-ten.vercel.app`
5. Click **Save Changes**.

---

## 2. Valid OAuth Redirect URIs (Facebook Login)

1. In the same app, go to **Use cases** (or **Products**) → **Facebook Login** → **Settings** (or **Customize**).
2. Find **Valid OAuth Redirect URIs**.
3. Add **exactly** the URL Facebook redirects to after login (no trailing slash unless your app uses it):
   - `https://engage-hub-ten.vercel.app/`
   - Or, if your app lives under a path: `https://engage-hub-ten.vercel.app/your-path/`
4. Click **Save Changes**.

---

## 3. Optional: Client OAuth Login

In **Settings** → **Basic**, ensure **Client OAuth Login** is **Yes** if you use the redirect (code) flow.

---

## Summary

| Setting | Value |
|--------|--------|
| **App Domains** | `engage-hub-ten.vercel.app` |
| **Valid OAuth Redirect URIs** | `https://engage-hub-ten.vercel.app/` |

After saving, wait a minute and try connecting Facebook again from EngageHub.
