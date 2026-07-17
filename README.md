# Datacrux Admin Panel

The admin dashboard for managing your AMARA sales agent - products, pricing,
and persona. Built with Next.js, talks to your existing NestJS backend.

## Setup

```bash
npm install
cp .env.local.example .env.local
# edit .env.local if your backend URL is different
npm run dev
```

Open http://localhost:3000 - you'll land on the login page. Use the same
admin email/password you use to log in via curl (e.g.
owner@demo-business.test).

## What's here

- **/login** - admin sign-in, stores a JWT in the browser
- **/products** - add, edit, and remove products (list price + negotiation floor)
- **/ai-settings** - customize AMARA's tone, greeting, and instructions

## Design notes

- Colors and the diamond/node motif are drawn directly from the Datacrux
  Africa logo - the loading spinner and list bullets are small nods to the
  mark's geometry, not decoration for its own sake.
- The "Always true, by design" box on the AI Persona page is deliberate: it's
  there so a business owner always sees, right next to the settings they
  control, the one thing they can't change (AMARA never states a price
  herself).

## Deploying

The easiest path is Vercel (made by the same team as Next.js, zero config
needed):

1. Push this folder to its own GitHub repo (or a `frontend` folder in an
   existing one)
2. Go to vercel.com, sign in with GitHub, import the repo
3. Add an environment variable: `NEXT_PUBLIC_API_URL` = your Railway backend URL
4. Deploy

Railway can also host a Next.js app directly if you'd rather keep everything
in one place - let your assistant know if you'd like that walkthrough instead.
