# Sentinel — Animated Virus Scanner

File & URL scanning via the VirusTotal API, with user accounts, a MongoDB-backed
per-user history, a Framer Motion "radar sweep" animation while a scan runs,
and a bug-themed loading screen on boot / auth.

## Database structure

Two Mongo collections:

**`users`**
| field         | type   | notes                          |
|---------------|--------|---------------------------------|
| username      | String | unique, lowercased              |
| passwordHash  | String | bcrypt hash, never the raw password |
| createdAt/updatedAt | Date | automatic timestamps      |

**`scans`**
| field      | type     | notes                                      |
|------------|----------|---------------------------------------------|
| user       | ObjectId | references `users._id`, indexed              |
| type       | String   | `"file"` or `"url"`                          |
| target     | String   | filename or URL scanned                      |
| sha256     | String   | file hash (file scans only)                  |
| verdict    | String   | `malicious` / `suspicious` / `harmless` / `undetected` |
| stats      | Object   | counts per verdict category from VirusTotal  |
| engines    | Array    | flagged engines (malicious/suspicious only)  |
| permalink  | String   | link to full VirusTotal report               |
| createdAt/updatedAt | Date | automatic timestamps                |

Every scan is scoped to `req.userId` (pulled from the JWT), so `/api/scan/history`
only ever returns the logged-in user's own scans — not everyone's.

## Auth flow

- `POST /api/auth/register` — creates a user, returns a JWT
- `POST /api/auth/login` — verifies password, returns a JWT
- `GET /api/auth/me` — validates a token (used on app boot to auto-login returning users)
- All `/api/scan/*` routes require `Authorization: Bearer <token>`
- The frontend stores the token in `localStorage` and auto-attaches it to every
  axios request via `AuthContext.jsx`

Set a `JWT_SECRET` in `server/.env` — any long random string works, e.g. generate
one with `openssl rand -hex 32`.

```
virus-scanner/
├── server/     Express API — talks to VirusTotal, stores results in MongoDB
└── client/     React + Vite + Framer Motion frontend
```

## 1. Get a VirusTotal API key

Sign up free at https://www.virustotal.com/gui/join-us, then grab your key from
your profile page (API Key section).

**Public API limits (free tier):** 4 requests/minute, 500 requests/day, and a
32MB max file size. The backend already handles this by polling every 3s
instead of hammering the API, but keep the daily cap in mind if you're testing
a lot — each scan uses 2–3 requests (submit + poll).

## 2. Get MongoDB running

Easiest options:
- **Local**: install MongoDB Community Server and it'll run on
  `mongodb://127.0.0.1:27017` by default.
- **Free hosted**: create a free M0 cluster on MongoDB Atlas and copy the
  connection string.

## 3. Configure the backend

```bash
cd server
npm install
cp .env.example .env
# then edit .env and paste in your VT_API_KEY and MONGO_URI
npm start
```

Server runs on `http://localhost:5000`.

## 4. Run the frontend

```bash
cd client
npm install
npm run dev
```

Opens on `http://localhost:5173` and proxies `/api` calls to the backend
automatically (see `vite.config.js`).

## Deploying

Vercel builds one app per project, and your Express+MongoDB backend isn't a
good fit for Vercel's serverless model anyway — so deploy the two halves
separately:

**Frontend → Vercel**
1. Import the repo into Vercel
2. In Project Settings → **Root Directory**, set it to `client`
3. Add an environment variable `VITE_API_URL` = your backend's deployed URL (see below)
4. Deploy — `client/vercel.json` handles SPA routing so refreshing on any page works

**Backend → Render, Railway, or Fly.io** (anything that runs a normal Node process)
1. New service, point it at this repo, set **Root Directory** to `server`
2. Build command: `npm install` · Start command: `npm start`
3. Add your `VT_API_KEY`, `MONGO_URI`, `JWT_SECRET`, and `PORT` env vars
4. Set `CLIENT_ORIGIN` to your Vercel URL (e.g. `https://sentinel.vercel.app`) so CORS allows it
5. Copy the resulting backend URL into the frontend's `VITE_API_URL`

Locally, none of this matters — `npm run dev` in `client/` still proxies
`/api` straight to `localhost:5000` as before.



1. You upload a file or paste a URL.
2. The backend submits it to VirusTotal (`POST /files` or `POST /urls`), gets
   back an analysis ID, and polls `GET /analyses/{id}` every 3 seconds until
   VirusTotal finishes (usually 10–60 seconds).
3. The verdict + engine detections + stats are saved to MongoDB and returned
   to the frontend.
4. The history list re-fetches from `GET /api/scan/history` and animates the
   new entry in.

## Notes / things you may want to change

- There's no auth on the API — fine for local/personal use, but add some
  before deploying this publicly (anyone hitting your `/api/scan/*` routes
  spends your daily VirusTotal quota).
- `pollAnalysis` in `server/routes/scan.js` gives up after ~60s
  (20 attempts × 3s). Bump `maxAttempts` if you're scanning larger files that
  take longer to analyze.
- Only detections marked `malicious` or `suspicious` are stored per-engine (to
  keep documents small) — full raw results are still visible via the
  VirusTotal permalink included in each scan result.
