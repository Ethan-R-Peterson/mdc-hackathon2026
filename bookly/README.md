# Bookly

A social reading competition web app where users log pages read, earn points, compete on leaderboards, and discover new books together. Built for college students who want to make reading social and competitive.

## Features

- **Book Search & Tracking** — Search Google Books, start reading, and track page progress
- **Reading Logs** — Log pages read and earn points (1pt/page, finish bonuses, streak bonuses)
- **Groups** — Create or join private groups with invite codes
- **Leaderboards** — Global and per-group leaderboards with weekly/monthly/all-time periods
- **Activity Feed** — See what your group members are reading in real time
- **Reviews** — Rate and review finished books with spoiler protection
- **User Profiles** — Public profiles with stats, badges, reading history, and reviews
- **Recommendations** — Personalized book suggestions based on reading history, genres, and group activity
- **Gamification** — 8 rank tiers (Bookworm to Library Legend), badges across reading/streak/social/points categories
- **People Search** — Find and follow other readers

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, TanStack Query |
| Backend | Supabase (Auth + Postgres + Row Level Security) |
| External | Google Books API |
| Hosting | Vercel |

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project
- Google Books API key

### Setup

1. Clone the repo and install dependencies:
```bash
cd bookly
npm install
```

2. Create `.env.local` with your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY=your_google_books_api_key
```

3. Run the database schema in your Supabase SQL Editor:
   - `supabase-schema.sql` (base tables, RLS policies, triggers)
   - `supabase-migration-reviews-profiles-badges.sql` (reviews, badges, profile fields)

4. Start the dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel, set root directory to `bookly`
3. Add the 3 environment variables
4. Deploy

## Points System

| Action | Points |
|--------|--------|
| Log pages | 1pt per page (100/day cap) |
| Finish a book | +50 pts |
| 3-day streak | +20 pts |
| 7-day streak | +50 pts |
| Submit a review | +10 pts |

A streak day = any calendar day with 10+ pages logged.

## Rank Tiers

| Rank | Points Required |
|------|----------------|
| Bookworm | 0 |
| Page Turner | 100 |
| Chapter Chaser | 300 |
| Story Seeker | 600 |
| Novel Knight | 1,000 |
| Lore Master | 2,000 |
| Tome Titan | 3,500 |
| Library Legend | 5,000 |

## Project Structure

```
bookly/
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── api/                # 12 API route handlers
│   │   ├── dashboard/          # User dashboard with stats
│   │   ├── groups/             # Group list, detail, leaderboard
│   │   ├── books/              # Book search
│   │   ├── my-books/           # User's reading list
│   │   ├── log/                # Log pages form
│   │   ├── leaderboard/        # Global leaderboard
│   │   ├── profile/[userId]/   # User profiles
│   │   ├── search/             # People search
│   │   ├── recommendations/    # Book recommendations
│   │   └── login/              # Auth page
│   ├── components/             # Reusable UI components
│   ├── hooks/                  # TanStack Query hooks
│   ├── lib/                    # Business logic & Supabase clients
│   │   ├── supabase/           # Client, server, middleware
│   │   ├── google-books.ts     # Google Books API
│   │   ├── points.ts           # Points & streak logic
│   │   ├── gamification.ts     # Ranks & badges
│   │   └── recommendations.ts  # Recommendation engine
│   ├── types/                  # TypeScript interfaces
│   └── providers/              # React context providers
├── middleware.ts                # Auth redirect middleware
└── .env.local                  # Environment variables
```

## Built With

Built at MDC Hackathon 2026.
