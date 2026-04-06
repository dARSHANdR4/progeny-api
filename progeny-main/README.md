# Progeny Web: Agricultural Management Dashboard

The professional web interface for Progeny AI, offering real-time plant scan monitoring, user management, and subscription control.

## 🚀 Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Radix UI
- **Database & Auth:** Supabase
- **Payments:** Stripe & Razorpay
- **Hosting:** Vercel

## 🛠️ Local Installation

1. **Environment Setup**
   ```bash
   cd progeny-main
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   **Required Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase API Key.
   - `ML_SERVICE_URL`: URL of the Progeny ML service (e.g., `http://localhost:5000`).

3. **Running for Development**
   ```bash
   npm run dev
   ```

## 🏗️ Core Features

- **Leaf Scanner:** Integrated camera/upload interface for instant disease detection.
- **Disease History:** Securely stored records of previous scans on Supabase.
- **Progeniture AI:** Agricultural chat assistant for farming advice.
- **Support System:** Dedicated help center for farmer queries.
- **Subscription Management:** Tiered access (Free/Farmer/Enterprise) via Stripe.

## 🚢 Production Deployment (Vercel)

Current production URL: `https://progeny-api.vercel.app`

### Deployment Steps:
1. Connect your GitHub repository to Vercel.
2. Select the `/progeny-main` directory.
3. Configure **Environment Variables** in the Vercel Dashboard.
4. Set the following Build Settings:
   - Framework: **Next.js**
   - Output Directory: **.next**
   - Build Command: `next build`

## 💼 Payment Integration
- **Stripe:** Used for global subscriptions. Configure via `STRIPE_SECRET_KEY`.
- **Razorpay:** Optimized for regional (India-focused) transactions. Configure via `RAZORPAY_KEY_ID`.

## 🔒 Authentication & Middleware
The app uses Supabase Auth with server-side session management.
- Routes under `/dashboard` are protected by `middleware.ts`.
- Ensure your Supabase project has **Row Level Security (RLS)** enabled for the `scans` and `profiles` tables.
