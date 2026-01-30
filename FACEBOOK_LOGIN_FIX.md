# Fix: "URL Blocked" when signing in with Facebook

Facebook shows **"URL Blocked - This redirect failed because the redirect URI is not whitelisted"** when the Facebook app does not have the correct redirect URI and domains.

EngageHub uses **Supabase Auth** for "Sign in with Facebook". Facebook must redirect back to Supabase, so you need to whitelist the **Supabase callback URL** in your Facebook app.

## Fix in the Facebook Developer Console

1. Go to **[developers.facebook.com](https://developers.facebook.com)** and open your app (the one with Client ID `859217093692094` or the one linked in Supabase).

2. In the left menu, open **Use cases** (or **Products**) and find **Facebook Login** → **Settings** (or **Facebook Login** → **Customize** → **Settings**).

3. **Client OAuth Login** and **Web OAuth Login** must be **Yes**.

4. In **Valid OAuth Redirect URIs**, add **exactly**:
   ```
   https://zourlqrkoyugzymxkbgn.supabase.co/auth/v1/callback
   ```
   (This is your Supabase project’s callback. If your project ref is different, use: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`.)

   For local dev, also add:
   ```
   http://localhost:3000/
   ```

5. In **App Domains** (in **Settings** → **Basic**), add:
   - `engage-hub-ten.vercel.app`
   - `zourlqrkoyugzymxkbgn.supabase.co`  
   (and `localhost` if you test locally.)

6. **Save changes**. It can take a few minutes to apply.

7. In **Supabase Dashboard** → **Authentication** → **Providers** → **Facebook**, make sure the **Client ID** and **Client Secret** match this Facebook app.

After saving, try **Sign in with Facebook** again; the "URL Blocked" error should stop.
