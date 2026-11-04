# Deployment Guide

This document describes how to deploy the application in production environments (using Docker Compose, Vercel, and Render).

---

## 1. Environment Configurations

Make sure to configure the following environment variables for production environments:

### Backend Production Environment (`server/.env`)
```ini
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?sslmode=require
JWT_SECRET=your_super_secure_production_secret_key_889922
JWT_EXPIRES_IN=24h
AI_AGENT_URL=https://sih-ai-agent.up.railway.app
```

### Frontend Production Environment (`client/.env`)
- Configure standard API proxies in Vite or set an absolute baseUrl.
- If deployed on Vercel, the API requests are proxied via `vercel.json` configurations or client-side axios defaults:
```ini
VITE_API_URL=https://sih-court-backend.onrender.com/api
```

---

## 2. Docker Compose Deployment (Self-Hosted Staging/Prod)

Deploying the complete stack on a virtual private server (VPS) like AWS EC2, DigitalOcean Droplet, or Linode:

1. **Clone project directory to server**:
   ```bash
   git clone https://github.com/yourteam/AI-Court-System.git
   cd AI-Court-System
   ```
2. **Build and start containers in detached mode**:
   ```bash
   docker-compose up --build -d
   ```
3. **Verify running containers**:
   ```bash
   docker-compose ps
   ```
   - Nginx Frontend Gateway will serve on port `80`.
   - Backend Express API will serve on port `5000` (proxied by Nginx).
   - PostgreSQL DB will serve on port `5432` internally.
   - AI Mock Simulator will serve on port `5001` internally.

---

## 3. Deployment to Cloud Services (PaaS)

For rapid prototype showcase, you can host components on free-tier cloud platforms.

### A. Backend on Render / Railway
1. **Repository setup**: Create a GitHub repository and push your code.
2. **Create Database**: Provision a managed PostgreSQL instance on Render Databases or Supabase.
3. **Deploy Web Service (Express Backend)**:
   - Create a Web Service on Render.
   - Connect it to your GitHub repository.
   - Set **Root Directory** to `server`.
   - Set **Build Command** to `npm install`.
   - Set **Start Command** to `npm start`.
   - Add environment variables:
     - `DATABASE_URL` (pointing to your managed PostgreSQL instance)
     - `JWT_SECRET` (generate a secure string)
     - `AI_AGENT_URL` (points to the deployed AI service)
     - `NODE_ENV` = `production`

### B. Mock AI Simulator on Render / Railway
1. **Deploy Web Service**:
   - Create a Web Service.
   - Set **Root Directory** to `ai-module`.
   - Set **Build Command** to `npm install`.
   - Set **Start Command** to `npm start`.
   - Set `PORT` = `5001`.

### C. Frontend on Vercel
Vercel is optimal for hosting static React Vite SPAs.

1. **Initialize deployment**:
   - Link Vercel to your GitHub repository.
   - Select the repository.
   - Set **Root Directory** to `client`.
   - Set **Framework Preset** to `Vite`.
   - Set **Output Directory** to `dist`.
   - Add build command: `npm run build`.
2. **Configure API Proxies**:
   To prevent Cross-Origin Resource Sharing (CORS) errors, create a `client/vercel.json` file to proxy all `/api/*` and `/uploads/*` requests to your deployed Render backend:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://sih-court-backend.onrender.com/api/:path*"
    },
    {
      "source": "/uploads/:path*",
      "destination": "https://sih-court-backend.onrender.com/uploads/:path*"
    }
  ]
}
```
   Push this configuration to make all client routing and attachments load seamlessly.
