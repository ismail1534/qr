# Deployment Guide

This project is split into two parts:
- **Backend**: Python Flask API (Deploy to Koyeb)
- **Frontend**: React Vite App (Deploy to Vercel)

## 1. Deploying Backend to Koyeb

1.  Push this repository to GitHub.
2.  Log in to [Koyeb](https://www.koyeb.com/).
3.  Create a new **Service**.
4.  Select **GitHub** as the deployment method and choose this repository.
5.  In the **Builder** section, choose **Dockerfile**.
6.  **Important**: Set the **Dockerfile Location** to `backend/Dockerfile`.
7.  In **Environment Variables**, add:
    *   `FRONTEND_URL`: The URL of your Vercel frontend (e.g., `https://my-app.vercel.app`). *You can update this after deploying frontend.*
    *   `BACKEND_URL`: The public URL provided by Koyeb (e.g., `https://my-app.koyeb.app`).
8.  Deploy.

> **Note**: Koyeb instances have ephemeral storage. Files uploaded will be deleted if the service restarts. For permanent storage, configure S3.

## 2. Deploying Frontend to Vercel

1.  Log in to [Vercel](https://vercel.com/).
2.  Click **Add New...** > **Project**.
3.  Import the same GitHub repository.
4.  In **Framework Preset**, ensure **Vite** is selected.
5.  **Root Directory**: Click "Edit" and select `frontend`.
6.  In **Environment Variables**, add:
    *   `VITE_API_URL`: The URL of your Koyeb backend (e.g., `https://my-app.koyeb.app`).
7.  Deploy.

## 3. Final Configuration

Once both are deployed:
1.  Copy the Vercel URL (e.g., `https://secure-file-frontend.vercel.app`).
2.  Go back to Koyeb Settings.
3.  Update the `FRONTEND_URL` variable with the Vercel URL.
4.  Redeploy Backend.

Your Secure File System is now live!
