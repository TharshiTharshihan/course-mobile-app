# Student QR App

React Native (Expo + NativeWind/Tailwind) mobile app with an Express + MongoDB Atlas backend.

- **Students**: sign up, log in, browse courses, open PDFs/notes the admin uploaded, see and share their own QR code.
- **Admin** (same app, hardcoded login): dashboard, view/search/edit/delete students, download/share any student's QR, scan QR codes to see details, add/edit/delete courses (name, code), upload/rename/delete PDFs.
- QR content is plain JSON (not encrypted): `{"type":"student","id":"<mongoId>","studentId":"...","name":"...","email":"..."}`.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB Atlas account and database
- Expo account for mobile development and EAS builds
- Android phone with Expo Go for local device testing, or an Android emulator

## 1. Run the backend locally

Open PowerShell in the repository root:

```bash
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` before starting the server:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/studentqr?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
```

Create a free cluster at https://www.mongodb.com/atlas, add a database user, and under **Network Access** allow your development IP. Avoid using `0.0.0.0/0` except for temporary testing.

Start the API in development mode:

```bash
npm run dev
```

The API runs at `http://localhost:5000`. Use `npm start` for a normal non-watch run:

```bash
npm start
```

Uploaded files are saved in `backend/uploads/` and served at `/uploads/<file>`.

## 2. Run the mobile app locally

In a second PowerShell window:

```bash
cd mobile
npm install
npx expo install --fix
```

Set the backend URL in `mobile/src/config.js`:

### Physical Android phone with Expo Go

Use the computer's Wi-Fi IP address. The phone and computer must be connected to the same network:

```js
export const API_URL = "http://192.168.1.25:5000";
```

### Android emulator

```js
export const API_URL = "http://10.0.2.2:5000";
```

### iOS simulator

```js
export const API_URL = "http://localhost:5000";
```

Start Expo:

```bash
npx expo start
```

Then scan the QR code with Expo Go, or press `a` to open an Android emulator. If the app cannot connect to the API, check the URL, Windows Firewall, and that both devices are on the same network.

## 3. Build an installable Android APK

The project includes two EAS profiles in `mobile/eas.json`. Both profiles generate an installable APK:

- `preview`: recommended for testing and internal distribution
- `production`: APK profile for a production-style build

Install or run the EAS CLI:

```bash
cd mobile
npm install
npx eas-cli login
```

Configure the project the first time, if required:

```bash
npx eas-cli build:configure
```

Build the preview APK:

```bash
npx eas-cli build --platform android --profile preview
```

Build using the production profile:

```bash
npx eas-cli build --platform android --profile production
```

You can also use the globally installed `eas` command:

```bash
eas build --platform android --profile preview
```

When the build finishes, EAS prints a download link for the `.apk`. Download the APK to the Android phone and install it. Android may require enabling **Install unknown apps** for the browser or file manager used to open the APK.

After changing navigation, fonts, native permissions, or other app code, create a new APK. An already-installed APK does not update automatically.

### Production APK checklist

Before distributing a build:

1. Set `API_URL` to a deployed HTTPS backend URL, not `localhost` or a local Wi-Fi IP.
2. Use a strong `JWT_SECRET` and `ADMIN_PASSWORD`.
3. Configure MongoDB Atlas Network Access for the deployed backend.
4. Keep `.env` files and credentials out of Git.
5. Verify registration, login, QR scanning, file upload, student editing, and admin deletion on a real device.
6. Use durable object storage for uploads. The local `backend/uploads/` folder is not reliable on hosts that use ephemeral disks.

The current app configuration uses the deployed API URL in `mobile/src/config.js`. Replace it with your own HTTPS API URL when deploying your own backend.

## 4. Deploy the backend

The backend can be deployed to a Node.js host such as Render, Railway, Fly.io, Azure App Service, or another production hosting provider.

Use these settings:

- **Root directory:** `backend`
- **Install command:** `npm install`
- **Start command:** `npm start`
- **Environment variables:** `PORT`, `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

After deployment, confirm the health endpoint:

```bash
curl https://your-api.example.com/
```

It should return JSON containing `"ok": true`. Then update `mobile/src/config.js`:

```js
export const API_URL = "https://your-api.example.com";
```

Build a new APK after changing the API URL.

### API summary
| Method | Path | Who |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| GET | /api/auth/me | logged in |
| PUT | /api/auth/me | logged-in student |
| GET | /api/courses, /api/courses/:id, /api/courses/:id/materials | logged in |
| POST/PUT/DELETE | /api/courses, /api/courses/:id | admin |
| POST | /api/courses/:id/materials (multipart `file`, `title`) | admin |
| PUT/DELETE | /api/materials/:id | admin |
| GET | /api/students, /api/students/stats, /api/students/:id | admin |
| PUT/DELETE | /api/students/:id | admin |

### Notes
- `package.json` uses loose versions on purpose; `npx expo install --fix` aligns packages with the installed Expo SDK.
- Camera scanning needs a real device (or an emulator with a camera feed).
- "Download / Share QR" exports the QR card as a PNG through the system share sheet (Save to Files/Gallery, WhatsApp, etc.).

## Project layout
```
backend/  Express API (models, routes, auth middleware)
mobile/   Expo app (src/screens, src/components, src/navigation.js)
```
