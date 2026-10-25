# 🚀 Deploying DGShop Backend to Render (Step-by-Step Guide)

This guide walks you through deploying your **DGShop Backend (Expo Router API + Neon PostgreSQL)** to **[Render.com](https://render.com)** for free.

Once deployed, you will get a permanent public HTTPS URL (e.g., `https://dgshop-backend.onrender.com`), enabling:
- ✅ Android Emulator to connect without `localhost` connection errors.
- ✅ Physical phones running Expo Go anywhere in the world to connect.
- ✅ 24/7 online availability for school project evaluation.

---

## 1. Prerequisites (Already Prepared)
- Your GitHub repository is ready: `https://github.com/jeannettenayituriki48-de/DGShop`
- `render.yaml` blueprint is added to your project.
- Production server script `"serve": "expo serve"` is added to `package.json`.

---

## 2. Step-by-Step Deployment on Render

### Step 1: Push your code to GitHub
If you haven't pushed the latest changes yet, run:
```powershell
git add .
git commit -m "feat: add render.yaml and serve script for Render deployment"
git push -u origin main
```
*(If you need to push via HTTPS: `git remote set-url origin https://github.com/jeannettenayituriki48-de/DGShop.git` then `git push -u origin main`)*.

---

### Step 2: Sign in to Render
1. Go to **[https://render.com](https://render.com)**
2. Click **Get Started** or **Sign In** using your **GitHub account** (`jeannettenayituriki48-de`).

---

### Step 3: Create New Web Service
1. On your Render dashboard, click the **New +** button in the top right.
2. Select **Web Service**.
3. Choose **Build and deploy from a Git repository** and click **Next**.
4. Connect your repository: **`jeannettenayituriki48-de/DGShop`** (click **Connect**).

---

### Step 4: Configure the Service Settings
Fill in the following fields:

| Field | Value |
|---|---|
| **Name** | `dgshop-backend` (or your preferred name) |
| **Language** | **Node** |
| **Branch** | `main` |
| **Region** | `Oregon (US West)` or `Frankfurt (EU Central)` |
| **Root Directory** | Leave **EMPTY** (blank) or `./` |
| **Build Command** | `npm install --legacy-peer-deps && npm run build` |
| **Start Command** | `node server.js` |
| **Instance Type** | **Free** ($0/month) |

---

### Step 5: Add Environment Variables
Scroll down to the **Environment Variables** section and click **Add Environment Variable** for each of these 4 keys:

| Key | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Production mode |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_ZBt5kSA3Unju@ep-holy-fire-b4ktn7bu-pooler.c-6.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require` | Pooled Neon PostgreSQL connection |
| `DATABASE_URL_UNPOOLED` | `postgresql://neondb_owner:npg_ZBt5kSA3Unju@ep-holy-fire-b4ktn7bu.c-6.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require` | Direct Neon PostgreSQL connection |
| `JWT_SECRET` | `dgshop-jwt-secret-change-in-production-2026` | Token signing secret |

---

### Step 6: Deploy!
1. Click the blue **Deploy Web Service** button at the bottom of the page.
2. Render will build the Expo project and launch the server.
3. Once completed (usually 2–3 minutes), the status indicator will turn **Live** 🟢.
4. Copy your live Render URL at the top of the page:
   ```text
   https://dgshop-backend.onrender.com
   ```

---

## 3. Connect Your Mobile App to the Live Render Backend

Once your backend is live on Render:

1. Open `.env.local` in your project.
2. Update `EXPO_PUBLIC_API_BASE_URL` with your Render URL:
   ```env
   EXPO_PUBLIC_API_BASE_URL=https://dgshop-backend.onrender.com
   ```
3. Restart your Expo development server:
   ```powershell
   npx expo start --clear
   ```

Now, whether you open the app on an Android Emulator, iPhone, Android phone, or Web browser, all requests will communicate with your live cloud backend on Render.
