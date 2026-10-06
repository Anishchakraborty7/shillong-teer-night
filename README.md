# SHILLONG TEER NIGHT

Official, production-ready results portal for **Shillong Teer Night**.

Built with React, Vite, JavaScript. Supports **100% Frontend Zero-Backend Free Cloud Storage** (Pantry / JSONBin) and optional Firebase.

---

## 🌟 Why This Architecture Is Perfect For You

- **Zero Backend / Zero Database to Manage**:
  - No Express, Node.js server, MySQL, or PostgreSQL to manage or pay for.
  - No complicated Firebase Console, rules, or Google authentication configuration required.
- **100% Frontend with Free Cloud Sync**:
  - Daily updates are synced across all ~100 mobile visitors via a free cloud JSON bucket (e.g. [getpantry.cloud](https://getpantry.cloud)).
  - Free forever, takes 10 seconds to setup (just a Pantry ID).
- **Single Game a Day**:
  - No complicated rounds.
  - Supports multiple winning numbers separated by commas (e.g. `23, 45` or `07, 88`).
  - Leading zeros are strictly preserved as strings (e.g. `"07"`).
  - Displays game time in brackets (e.g. `TODAY'S RESULT (8.30 PM)`).
- **Automatic Archiving & Duplicate Protection**:
  - The administrator only updates **Today's Result**.
  - Changing the date automatically archives yesterday's result into **Past Results**.
- **Admin Login & Dashboard**:
  - Direct login button in the header.
  - Login with Admin ID (`admin`) and Password (default: `admin123`).
  - Change password directly in the admin dashboard anytime.
  - Configure cloud sync directly inside the admin dashboard with 1 click.

---

## 🚀 Quick Start (Zero Setup)

### 1. Install & Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### 2. Admin Login
- Click **Admin Login** in the top-right corner of the site.
- **Admin ID**: `admin`
- **Password**: `admin123`

---

## ☁️ How to Enable Free Cloud Sync for All Visitors (10 Seconds)

To ensure that when you update results on your computer, all 100 mobile visitors see the changes live on their phones:

1. Open [https://getpantry.cloud](https://getpantry.cloud) and click **Create a Pantry**.
2. Enter your email to receive your free **Pantry ID** (a free UUID like `c0356bf5-9279-4bc7-b86e-bcfc70f05cb4`).
3. Log in to your Admin Panel (`/admin`), click **Configure Cloud ▼**, paste your **Pantry ID**, and click **SAVE & CONNECT CLOUD**.
4. That's it! Every time you update Today's Result or Common Numbers, it automatically syncs to all visitors worldwide for free.

*(Alternatively, you can add `VITE_PANTRY_ID=your_id` to your `.env` file).*

---

## 📦 Deployment Options

Since this website is 100% static frontend, you can deploy it to **any free host**:

### Option A: Vercel / Netlify / Render (Recommended)
1. Push your repository to GitHub.
2. Link your repository in **Vercel**, **Netlify**, or **Render** (Static Site).
3. Set Build Command: `npm run build`
4. Set Output Directory: `dist`
5. Done! Free global CDN hosting.

### Option B: Firebase Hosting
```bash
npm run build
npx firebase deploy --only hosting
```

---

## 🔐 Customizing Admin Password

You can change your admin password in two ways:
1. **From Admin Panel**: In the admin dashboard, open **Configure Cloud ▼**, enter your new password, and click **Update Password**.
2. **From `.env`**: Set `VITE_ADMIN_PASSWORD=your_secure_password`.
