# Fix: "The OAuth client was deleted" (Google Sign-In)

EngageHub uses **Supabase Auth** for "Sign in with Google". The error **"Access blocked: Authorization Error - The OAuth client was deleted"** (Error 401: deleted_client) means the Google OAuth client configured in Supabase was deleted in Google Cloud Console.

## Fix in 5 minutes

### 1. Create a new OAuth client in Google Cloud

1. Go to **[Google Cloud Console](https://console.cloud.google.com/)** and sign in.
2. Select your project (or create one).
3. Open **APIs & Services** → **Credentials**.
4. Click **+ Create Credentials** → **OAuth client ID**.
5. If asked, configure the **OAuth consent screen** (User type: External, add your email, app name, save).
6. **Application type:** **Web application**.
7. **Name:** e.g. `EngageHub Web` or `Supabase Auth`.
8. **Authorized redirect URIs** — add **both**:
   - For Supabase:  
     `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`  
     (Find your project ref in Supabase: Project Settings → General → Reference ID.)
   - For local dev:  
     `http://localhost:3000/`
   - For production:  
     `https://engage-hub-ten.vercel.app/`
9. Click **Create**. Copy the **Client ID** and **Client secret**.

### 2. Update Supabase Google provider

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)** → your project.
2. Open **Authentication** → **Providers** → **Google**.
3. **Enable** Google if it’s off.
4. Paste the **Client ID** and **Client secret** from step 1.
5. Click **Save**.

### 3. Test

1. Sign out of EngageHub if you’re signed in.
2. Open your app and click **Sign in with Google**.
3. You should be redirected to Google and then back to the app without the "OAuth client was deleted" error.

---

**Note:** The Google client used for **YouTube connection** (Social Media) can be the same OAuth client or a different one. If you use the same client, add the redirect URIs your app uses for YouTube OAuth (e.g. `http://localhost:3000`, `https://engage-hub-ten.vercel.app`) in the same OAuth client’s **Authorized redirect URIs**.
