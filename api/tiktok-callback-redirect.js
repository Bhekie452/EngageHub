export default async function handler(req, res) {
  // Handle TikTok OAuth callback and redirect to immediate exchange page
  const { code, state, error } = req.query;

  if (error) {
    // Redirect to error page
    return res.redirect(`/tiktok-immediate-callback.html?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(req.query.error_description || '')}`);
  }

  if (!code) {
    // Redirect to error page
    return res.redirect(`/tiktok-immediate-callback.html?error=missing_code&error_description=No authorization code received`);
  }

  if (state !== 'tiktok_oauth') {
    // Redirect to error page
    return res.redirect(`/tiktok-immediate-callback.html?error=invalid_state&error_description=State mismatch: expected 'tiktok_oauth', got '${state}'`);
  }

  // Redirect to immediate exchange page with the code
  return res.redirect(`/tiktok-immediate-callback.html?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
}
