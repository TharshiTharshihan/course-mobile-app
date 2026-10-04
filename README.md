# Student QR App

React Native (Expo + NativeWind/Tailwind) app with a PickMe/Uber-style UI, plus an Express + MongoDB Atlas backend.

- **Students**: sign up, log in, browse courses, open PDFs/notes the admin uploaded, see and share their own QR code.
- **Admin** (same app, hardcoded login): dashboard, view/search/edit/delete students, download/share any student's QR, scan QR codes to see details, add/edit/delete courses (name, code), upload/rename/delete PDFs.
- QR content is plain JSON (not encrypted): `{"type":"student","id":"<mongoId>","studentId":"...","name":"...","email":"..."}`.

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env     # then edit .env
npm run dev              # or: npm start
```

1. Create a free cluster at https://www.mongodb.com/atlas (M0), add a database user, and under *Network Access* allow your IP (or 0.0.0.0/0 for testing).
2. Paste the connection string into `MONGO_URI` in `.env`.
3. Admin credentials come from `.env` (`ADMIN_EMAIL=admin@gmail.com`, `ADMIN_PASSWORD=admin123`). Change them there.

Uploaded files are saved in `backend/uploads/` and served at `/uploads/<file>`.

### API summary
| Method | Path | Who |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| GET | /api/auth/me | logged in |
| GET | /api/courses, /api/courses/:id, /api/courses/:id/materials | logged in |
| POST/PUT/DELETE | /api/courses, /api/courses/:id | admin |
| POST | /api/courses/:id/materials (multipart `file`, `title`) | admin |
| PUT/DELETE | /api/materials/:id | admin |
| GET | /api/students, /api/students/stats, /api/students/:id | admin |
| PUT/DELETE | /api/students/:id | admin |

## 2. Mobile app

```bash
cd mobile
npm install
npx expo install --fix   # aligns every package to your Expo SDK version
```

Open `mobile/src/config.js` and set `API_URL` to your computer's Wi-Fi IP, e.g. `http://192.168.1.25:5000` (phone and computer on the same Wi-Fi; Android emulator uses `http://10.0.2.2:5000`).

```bash
npx expo start
```

Scan the QR with Expo Go. Recent Expo Go versions ask you to sign in to the same Expo account in the CLI (`npx expo login`) and in the app.

### Notes
- `package.json` uses loose versions on purpose; `npx expo install --fix` pins the right ones for the SDK that your Expo Go supports. If Expo Go and the project SDK disagree, change the `expo` version (e.g. `npx expo install expo@^55`) and run `--fix` again.
- Camera scanning needs a real device (or an emulator with a camera feed).
- "Download / Share QR" exports the QR card as a PNG through the system share sheet (Save to Files/Gallery, WhatsApp, etc.).
- Uploads on free hosting that wipes disk (Render free, etc.) will disappear on restart; for production move uploads to Cloudinary/S3.

## Project layout
```
backend/  Express API (models, routes, auth middleware)
mobile/   Expo app (src/screens, src/components, src/navigation.js)
```
