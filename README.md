# Student QR App

Attendance and class-management app for a tuition class owner (teacher) and their students. React Native (Expo + NativeWind) mobile app with an Express + MongoDB Atlas backend.

- **Teacher (admin)**
  - **QR attendance:** choose a class, then scan students one after another. Each student is marked once per day per class.
  - **Attendance register:** pick a day and class to see who's present and absent, and remove a mistaken check-in.
  - **Notices:** send announcements, class-time reminders and "bring this to class" notes, to everyone or to one class, with pinning.
  - **Classes and notes:** create classes, then upload, rename and delete PDFs and other notes.
  - **Students:** search, view, edit and delete students, view each student's attendance, and reset a lost or shared QR.
  - **Account:** change name, email and password. The setup password from `.env` must be changed after the first login.
- **Students:** sign up, open class notes, read notices (unread ones are tagged "New"), show their QR at class, and see their attendance and profile. They can also change their password.

## Security model

- **Signed QR codes.** A student QR contains `SQR1.<id>.<version>.<signature>`. The signature is an HMAC made by the server with `QR_SECRET` (or `JWT_SECRET` if that's empty). It holds no personal data and can't be forged or edited. A scan is accepted only when the signature is valid **and** the student still exists in the database. **Reset QR** increases the version, so an old card stops working.
- **Admin account.** The first login with `ADMIN_EMAIL` / `ADMIN_PASSWORD` creates the admin in the database, with a hashed password, and asks for a new password. After that, the `.env` password no longer works.
  - *Forgot the admin password?* In MongoDB Atlas, delete the single document in the `admins` collection. The `.env` login then works once more, and creates a fresh admin.
- **Login rate limit.** After 10 failed logins for one email from one IP, that combination is blocked for 15 minutes.
- **Known limit:** uploaded files under `/uploads/...` can be opened by anyone who has the exact link.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB Atlas account and database
- Expo account for mobile development and EAS builds
- Android phone with Expo Go for local device testing, or Android Studio (for the PC emulator)

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
# Optional: signs student QR codes (falls back to JWT_SECRET). Changing it invalidates every QR.
QR_SECRET=
# First admin login only; you'll be asked to change the password in the app.
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
```

Generate a strong secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

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

Then scan the QR code with Expo Go. If the app cannot connect to the API, check the URL, Windows Firewall, and that both devices are on the same network.

## 2a. Run on an Android emulator on your PC (Windows)

### One-time setup

1. Install **Android Studio** from https://developer.android.com/studio.
2. Open Android Studio → **More Actions → SDK Manager** and make sure these are installed:
   - **SDK Platforms:** a recent Android version (e.g. Android 14/15)
   - **SDK Tools:** Android SDK Platform-Tools, Android Emulator, Android SDK Build-Tools
3. Open **More Actions → Virtual Device Manager → Create device**, pick a phone (e.g. Pixel 7), choose a system image with **Google Play**, and finish.
4. Set the environment variables (PowerShell, then reopen the terminal):

   ```powershell
   [Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
   $p = [Environment]::GetEnvironmentVariable("Path", "User")
   [Environment]::SetEnvironmentVariable("Path", "$p;$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator", "User")
   ```

5. Check it works:

   ```powershell
   adb version
   emulator -list-avds
   ```

### Every time you run the app

From the `mobile` folder:

```bash
# 1. Boot the emulator and wait until adb sees it (first AVD by default)
npm run emulator

# or choose a specific AVD by name
npm run emulator -- <AVD name from "emulator -list-avds">

# 2. Start Expo and open the app on the emulator
npm run android
```

`npm run emulator` runs [mobile/scripts/start-emulator.ps1](mobile/scripts/start-emulator.ps1). It starts the emulator, fixes the common "device unauthorized" adb problem, and waits until Android has finished booting.

In development the app has no "Student QR" icon of its own. It runs inside **Expo Go**, which `npm run android` installs on the emulator the first time. To get a real app icon, build and install the APK (section 3).

You can also start Expo with `npx expo start` and press `a` in the terminal to open the app on the running emulator. Press `r` to reload and `j` to open the debugger.

When the backend runs on your own PC, set `API_URL` to `http://10.0.2.2:5000` in `mobile/src/config.js`. Inside the emulator, `10.0.2.2` is your computer's `localhost`.

### Emulator troubleshooting

| Problem | Fix |
|---|---|
| `adb` / `emulator` not recognized | Set `ANDROID_HOME` and `Path` as above, then reopen the terminal |
| `No AVD found` | Create a virtual device in Android Studio → Virtual Device Manager |
| Device shows `unauthorized` / `offline` | `adb kill-server` then `adb start-server`, or run `npm run emulator` again |
| App can't reach the API | Use `http://10.0.2.2:5000` (not `localhost`) and make sure the backend is running |
| "System UI isn't responding" / very slow emulator | In Android Studio → Device Manager → Edit device → **Graphics: Hardware**. Or set `hw.gpu.enabled = yes` and `hw.gpu.mode = host` in `%USERPROFILE%\.android\avd\<name>.avd\config.ini`. Close Chrome/Edge tabs to free RAM, since the emulator needs about 3 GB. |
| Emulator window closes by itself (crash in `nvoglv64.dll` in Windows Event Viewer) | Old NVIDIA OpenGL driver. The script uses `-gpu angle_indirect` to avoid it. Updating the NVIDIA driver lets you use the faster `hw.gpu.mode = host` |
| `It took too long to start the Android emulator` or `cannot connect to 127.0.0.1:5554` | Run `npm run emulator` first and wait for "Emulator is ready", then run `npm run android` |
| Login shows **"Network Error"** on the emulator (logcat: `Trust anchor for certification path not found`) | An antivirus is scanning HTTPS (e.g. **Avast → Protection → Core Shields → Web Shield → turn off "Enable HTTPS scanning"**). The emulator does not trust the antivirus certificate. Real phones are not affected |
| Stale bundle / odd errors | `npx expo start -c` to clear the Metro cache |
| Dependency version warnings | `npm run fix-deps` (runs `expo install --fix`) |

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
- **Environment variables:** `PORT`, `MONGO_URI`, `JWT_SECRET`, `QR_SECRET` (optional), `ADMIN_EMAIL`, `ADMIN_PASSWORD`

After deployment, confirm the health endpoint:

```bash
curl https://your-api.example.com/
```

It should return JSON containing `"ok": true`. Then update `mobile/src/config.js`:

```js
export const API_URL = "https://your-api.example.com";
```

Build a new APK after changing the API URL.

## 5. Production command cheat sheet

### Backend

```bash
cd backend
npm ci                 # clean install from package-lock.json
npm start              # run the API (node src/server.js)
```

Set `NODE_ENV=production` and the variables from section 1 on the host. Don't use `npm run dev` in production because it runs in watch mode.

### Mobile (EAS)

```bash
cd mobile
npm ci
npx expo install --fix                 # align packages with the Expo SDK
npx expo-doctor                        # check the project for problems before building
npx eas-cli login
npx eas-cli whoami

# Installable APKs (both profiles in eas.json produce an .apk)
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production

# Build status and download links
npx eas-cli build:list --platform android
```

To install a finished APK straight onto a running emulator or USB-connected phone:

```bash
adb install -r path	opp.apk
```

### Test a release build locally (no EAS)

This needs Android Studio, the JDK it bundles, and `ANDROID_HOME` set:

```bash
cd mobile
npx expo run:android --variant release
```

This generates the native `android/` folder, builds a release app, and installs it on the running emulator or connected device.

### Google Play (optional)

The Play Store needs an `.aab` instead of an `.apk`. To publish there, add a store profile to `eas.json`:

```json
"store": { "android": { "buildType": "app-bundle" } }
```

Then run:

```bash
npx eas-cli build --platform android --profile store
npx eas-cli submit --platform android --latest
```

Increase `version` in `mobile/app.json` before each release.

## API summary
| Method | Path | Who |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| GET / PUT | /api/auth/me (student: name, phone · admin: name, email) | logged in |
| PUT | /api/auth/password (`currentPassword`, `newPassword`, `confirmPassword`) | logged in |
| GET | /api/courses, /api/courses/:id, /api/courses/:id/materials | logged in |
| POST/PUT/DELETE | /api/courses, /api/courses/:id | admin |
| POST | /api/courses/:id/materials (multipart `file`, `title`) | admin |
| PUT/DELETE | /api/materials/:id | admin |
| GET | /api/students, /api/students/stats, /api/students/:id | admin |
| PUT/DELETE | /api/students/:id | admin |
| POST | /api/students/:id/reset-qr | admin |
| POST | /api/attendance/scan (`code`, `course` or null, `mark`) | admin |
| GET | /api/attendance?date=YYYY-MM-DD&course=all\|general\|<id> | admin |
| DELETE | /api/attendance/:id | admin |
| GET | /api/attendance/me | student |
| GET | /api/announcements | logged in |
| POST/PUT/DELETE | /api/announcements, /api/announcements/:id | admin |

Attendance days use Sri Lanka time (`Asia/Colombo`); set `TZ_NAME` to change it.

## Notes
- `package.json` uses loose versions on purpose; `npx expo install --fix` aligns packages with the installed Expo SDK.
- Camera scanning needs a real device (or an emulator with a camera feed).
- **Upgrading from the old version:** QR codes printed before the signed-QR change (plain JSON) are rejected. Students just open **My QR** again to get the new code. The first admin login after deploying creates the admin from `.env`.
- "Download / Share QR" exports the QR card as a PNG through the system share sheet (Save to Files/Gallery, WhatsApp, etc.).

## Project layout
```
backend/  Express API (models, routes, auth + rate-limit middleware, qr.js signing)
mobile/   Expo app (src/screens, src/components, src/navigation.js)
```
