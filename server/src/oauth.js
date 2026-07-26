const redirect = path => (process.env.SERVER_ORIGIN || 'http://localhost:4000') + path;

export const google = {
  configured: () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  authUrl(state) {
    const p = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirect('/api/auth/google/callback'),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account'
    });
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + p;
  },
  async profile(code) {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirect('/api/auth/google/callback'),
        grant_type: 'authorization_code'
      })
    });
    const token = await tokenRes.json();
    if (!token.access_token) throw new Error('Google token exchange failed');
    const me = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { authorization: 'Bearer ' + token.access_token }
    }).then(r => r.json());
    if (!me.email) throw new Error('Google account has no email');
    return { name: me.name, email: me.email, provider: 'google', providerId: me.id };
  }
};

export const github = {
  configured: () => !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  authUrl(state) {
    const p = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: redirect('/api/auth/github/callback'),
      scope: 'read:user user:email',
      state
    });
    return 'https://github.com/login/oauth/authorize?' + p;
  },
  async profile(code) {
    const token = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        redirect_uri: redirect('/api/auth/github/callback')
      })
    }).then(r => r.json());
    if (!token.access_token) throw new Error('GitHub token exchange failed');
    const headers = { authorization: 'Bearer ' + token.access_token, accept: 'application/vnd.github+json' };
    const me = await fetch('https://api.github.com/user', { headers }).then(r => r.json());
    let email = me.email;
    if (!email) {
      const list = await fetch('https://api.github.com/user/emails', { headers }).then(r => r.json());
      const primary = Array.isArray(list) ? list.find(e => e.primary && e.verified) || list[0] : null;
      email = primary?.email;
    }
    if (!email) throw new Error('GitHub account has no usable email');
    return { name: me.name || me.login, email, provider: 'github', providerId: String(me.id) };
  }
};
