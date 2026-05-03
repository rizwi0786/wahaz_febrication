// Thin wrapper around the Google Calendar API used to auto-create
// Google Meet events for consultation bookings.
//
// Setup (one-time, see SETUP_GOOGLE_MEET.md):
//   1. Google Cloud Console → enable Google Calendar API
//   2. Create OAuth 2.0 Client ID (Web application)
//   3. Add redirect URI: http://localhost:5000/api/admin/google/callback
//   4. Visit /api/admin/google/auth-url (admin), authorize as
//      bellisssimocouture@gmail.com, paste the printed refresh token
//      into .env as GOOGLE_OAUTH_REFRESH_TOKEN
//
// If env vars are missing, createMeetEvent() resolves to
// { configured: false } and the caller falls back to the manual flow.

let google;
try {
  ({ google } = require('googleapis'));
} catch (_) {
  // googleapis not installed yet — feature simply stays disabled.
  google = null;
}

const REDIRECT_URI =
  process.env.GOOGLE_OAUTH_REDIRECT_URI ||
  'http://localhost:5000/api/admin/google/callback';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

function buildOAuth2Client() {
  if (!google) return null;
  const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } = process.env;
  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET) return null;
  return new google.auth.OAuth2(
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    REDIRECT_URI,
  );
}

function getAuthClient() {
  const oAuth2Client = buildOAuth2Client();
  if (!oAuth2Client) return null;
  if (!process.env.GOOGLE_OAUTH_REFRESH_TOKEN) return null;
  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });
  return oAuth2Client;
}

function generateAuthUrl() {
  const oAuth2Client = buildOAuth2Client();
  if (!oAuth2Client) return null;
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
}

async function exchangeCodeForTokens(code) {
  const oAuth2Client = buildOAuth2Client();
  if (!oAuth2Client) throw new Error('Google OAuth client is not configured');
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

/**
 * Combine "YYYY-MM-DD" and "HH:MM" into a Date (interpreted in IST).
 */
function combineDateTimeIST(dateLike, timeStr) {
  const d = new Date(dateLike);
  const [hh = '00', mm = '00'] = (timeStr || '00:00').split(':');
  // Build a local Date as if the values are in IST (UTC+05:30).
  const utcMs = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    Number(hh),
    Number(mm),
    0,
  );
  // Subtract IST offset to get the actual UTC instant.
  return new Date(utcMs - 5.5 * 60 * 60 * 1000);
}

async function createMeetEvent({
  summary,
  description,
  preferredDate,
  preferredTime,
  durationMinutes = 30,
  attendeeEmails = [],
}) {
  const auth = getAuthClient();
  if (!auth) return { configured: false };

  const calendar = google.calendar({ version: 'v3', auth });
  const start = combineDateTimeIST(preferredDate, preferredTime);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const requestId = `bc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const event = {
    summary,
    description,
    start: { dateTime: start.toISOString(), timeZone: 'Asia/Kolkata' },
    end: { dateTime: end.toISOString(), timeZone: 'Asia/Kolkata' },
    attendees: attendeeEmails.filter(Boolean).map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: { useDefault: true },
  };

  const res = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all', // Google emails calendar invites to attendees
  });

  return {
    configured: true,
    eventId: res.data.id,
    meetLink: res.data.hangoutLink || null,
    htmlLink: res.data.htmlLink || null,
  };
}

module.exports = {
  createMeetEvent,
  generateAuthUrl,
  exchangeCodeForTokens,
  isConfigured: () => !!getAuthClient(),
};
