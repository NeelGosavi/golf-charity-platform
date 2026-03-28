# Golf Charity Platform

A subscription-based golf platform combining performance tracking, charity fundraising, and monthly prize draws.

## Features

- **User Authentication** - JWT-based authentication
- **Score Management** - Track last 5 Stableford scores (1-45)
- **Charity System** - Support charities with 10%+ of subscription
- **Monthly Draws** - Random and algorithmic draw engine
- **Winner Verification** - Admin approval with proof upload
- **Subscription** - Stripe payments (₹299/month, ₹4,999/year)
- **Admin Dashboard** - Full control over users, charities, draws, winners

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + MongoDB
- **Payment**: Stripe
- **Hosting**: Vercel (frontend) + Render (backend)

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Stripe account

### Environment Variables

**backend/.env:**
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_YEARLY_PRICE_ID=price_xxx
FRONTEND_URL=http://localhost:5173