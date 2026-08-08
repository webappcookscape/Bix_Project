# ⚙️ Installation & Setup Guide

Follow these steps to get the project running on your local machine.

## 📋 Prerequisites
- **Node.js:** v20.x or higher (LTS recommended)
- **npm:** v10.x or higher
- **PostgreSQL:** v15 or higher (Ensure it is running)
- **Git**

## 🛠 Step 1: Clone the Repository
```powershell
git clone <repository-url>
cd unified-cookscape
```

## 🛠 Step 2: Backend Configuration
Navigate to the server directory and install dependencies.
```powershell
cd server
npm install
```

### Create `.env` file in `/server`:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/cookscape_db"
JWT_SECRET="your_super_secret_key_at_least_32_chars"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
GOOGLE_CLIENT_ID="your-google-client-id"
```

### Database Migration:
```powershell
# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate dev --name init
```

## 🛠 Step 3: Frontend Configuration
Open a new terminal, navigate to the root, and install dependencies.
```powershell
# From the root directory
npm install
```

### Create `.env` file in the root:
```env
VITE_API_URL="http://localhost:5000/api"
VITE_GOOGLE_CLIENT_ID="your-google-client-id"
```

## 🛠 Step 4: Running the Project

### Start Backend (Server):
```powershell
cd server
npm run dev
```
*Backend will run on: `http://localhost:5000`*

### Start Frontend (Client):
```powershell
# From root
npm run dev
```
*Frontend will run on: `http://localhost:5173`*

## ⚠️ Common Issues & Fixes
- **Prisma Error (P1001):** Ensure your PostgreSQL service is running and the `DATABASE_URL` in `.env` is correct.
- **Node Version Mismatch:** Use `node -v` to check. If below v20, update via NVM.
- **Port Conflict:** If port 5173 is busy, Vite will automatically pick another. Update `VITE_API_URL` accordingly.
- **bcryptjs issues on Windows:** If you face compilation errors, ensure you have C++ Build Tools installed or use the pre-compiled versions.

## 🏗 Production Build
```powershell
# Build Frontend
npm run build

# Start Production Server
cd server
npm start
```
