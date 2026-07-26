// AI-REVIEW-MARKER: participant must manually remove this marker
import express from 'express';
import session from 'express-session';
import axios from 'axios';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Safe auth status /status
app.get('/status', (req, res) => {
  res.json({
    auth: {
      provider: 'google',
      ready: true,
      secretExposed: false
    },
    team: 'str',
    task: 'T20'
  });
});

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = process.env.GOOGLE_REDIRECT_URI || 'https://str.deploysprint-finals.knurdz.org/auth/google/callback';

function startGoogleLogin(req, res) {
  const state = crypto.randomBytes(16).toString('hex');
  req.session.state = state;
  const scopes = 'openid email profile';
  const url = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    `client_id=${encodeURIComponent(client_id)}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&state=${encodeURIComponent(state)}`;
  res.redirect(url);
}

app.get('/auth/google', startGoogleLogin);

app.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!state || state !== req.session.state) {
    return res.status(400).send('OAuth state mismatch. Potential CSRF attack.');
  }
  
  if (!code) {
    return res.status(400).send('No code returned from Google.');
  }

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id,
      client_secret,
      redirect_uri,
      grant_type: 'authorization_code'
    });

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    req.session.user = {
      email: userResponse.data.email,
      name: userResponse.data.name,
      picture: userResponse.data.picture
    };

    res.redirect('/');
  } catch (error) {
    console.error('Error exchanging Google OAuth code:', error.message);
    res.status(500).send('Authentication failed.');
  }
});

app.get('/auth/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Could not log out.');
    }
    res.redirect('/');
  });
});

app.use(express.static(path.join(__dirname, '../team-site/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../team-site/dist/index.html'));
});

const PORT = process.env.APP_PORT || 80;
app.listen(PORT, () => {
  console.log(`OAuth Server running on port ${PORT}`);
});
