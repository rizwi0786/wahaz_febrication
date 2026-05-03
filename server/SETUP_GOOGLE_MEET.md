# Auto-create Google Meet for consultation bookings

One-time setup so each booking automatically creates a real Google Meet event
with the customer's email and your Gmail (`bellisssimocouture@gmail.com`)
listed as attendees. Google emails the calendar invite (with the Meet link)
to both addresses.

## 1. Install the dependency

```bash
cd server
npm install
```

(`googleapis` is already in `package.json`.)

## 2. Google Cloud Console — create OAuth credentials

1. Open https://console.cloud.google.com/ and sign in as **bellisssimocouture@gmail.com**.
2. Create a new project (e.g. *Bellissimo Couture*).
3. **APIs & Services → Library** → enable **Google Calendar API**.
4. **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - App name: *Bellissimo Couture*
   - Support email + developer email: `bellisssimocouture@gmail.com`
   - Add scope: `https://www.googleapis.com/auth/calendar.events`
   - Add yourself (`bellisssimocouture@gmail.com`) under **Test users**
5. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:5000/api/admin/google/callback`
     (add your production URL too when you deploy)
   - Copy the **Client ID** and **Client Secret**.

## 3. Drop the Client ID + Secret into `.env`

Edit `server/.env`:

```env
GOOGLE_OAUTH_CLIENT_ID=<paste here>
GOOGLE_OAUTH_CLIENT_SECRET=<paste here>
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/api/admin/google/callback
GOOGLE_OAUTH_REFRESH_TOKEN=
```

Restart the server (`npm run dev`).

## 4. Authorize once to obtain the refresh token

1. Sign in to your storefront as an **admin** (so your browser has the JWT).
2. In a new tab, open: `http://localhost:5000/api/admin/google/auth-url`
   (you'll need to call it via a tool that sends your auth header — easiest:
   open browser devtools → Network → copy any admin request → re-issue this
   GET. Or temporarily call it from the admin UI if you wire a button.)
3. Copy the `url` value from the JSON response into the browser address bar.
4. Sign in as `bellisssimocouture@gmail.com`, click **Continue** through the
   "unverified app" warning (it's your own app), grant the calendar scope.
5. Google redirects to `http://localhost:5000/api/admin/google/callback?code=...`
   The page renders the **refresh token** — copy it.
6. Paste it into `server/.env`:

   ```env
   GOOGLE_OAUTH_REFRESH_TOKEN=<paste here>
   ```

7. Restart the server. Done.

## 5. Verify

- Check `GET /api/admin/google/status` — should show `"configured": true`.
- Submit a test booking from `/services/schedule`. Within a few seconds:
  - The booking is created with status `CONFIRMED` and a `meetLink`.
  - You and the customer both receive a Google Calendar invite email.
  - The booking confirmation email also includes the Meet link.

## Troubleshooting

- **"No refresh token returned"** on the callback page → Google only sends a
  refresh token on the *first* authorization. Go to your Google Account →
  Security → Third-party access → remove the app → retry step 4.
- **400 invalid_grant** in server logs → refresh token was revoked. Repeat
  step 4 to get a new one.
- **Auto-Meet failed** → server logs `[google-calendar] <error>`. Booking
  still saves as `PENDING`; admin can confirm manually from the admin panel.
