# Bookly - Architecture Document

## Overview

Bookly is a social reading competition app. Users log pages read from books, earn points, compete on leaderboards, review books, earn badges, and discover new reads through personalized recommendations. Built with Next.js + Supabase, targeting college students.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, TanStack Query |
| Backend | Supabase (Auth + Postgres + Row Level Security) |
| External | Google Books API |
| Hosting | Vercel |

---

## Folder Structure

```
bookly/
├── public/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (providers)
│   │   ├── page.tsx                # Redirect to dashboard
│   │   ├── login/page.tsx          # Auth page (sign in / sign up)
│   │   ├── dashboard/page.tsx      # User dashboard (stats, rank, books, groups)
│   │   ├── groups/
│   │   │   ├── page.tsx            # List/join/create groups
│   │   │   └── [groupId]/
│   │   │       ├── page.tsx        # Group detail (members, feed, leaderboard)
│   │   │       └── leaderboard/
│   │   │           └── page.tsx    # Full group leaderboard with period toggle
│   │   ├── books/page.tsx          # Book search (Google Books API)
│   │   ├── my-books/page.tsx       # User's reading list + review buttons
│   │   ├── log/page.tsx            # Log pages form + review prompt on finish
│   │   ├── leaderboard/page.tsx    # Global leaderboard with podium + period toggle
│   │   ├── profile/
│   │   │   └── [userId]/page.tsx   # User profile (stats, badges, books, reviews)
│   │   ├── search/page.tsx         # People search by username
│   │   ├── recommendations/page.tsx # Personalized book recommendations
│   │   └── api/
│   │       ├── books/search/route.ts       # Proxy Google Books API
│   │       ├── user-books/route.ts         # List & start reading books
│   │       ├── reading-logs/route.ts       # Log pages + points + streaks + badges
│   │       ├── groups/
│   │       │   ├── route.ts                # List & create groups
│   │       │   ├── join/route.ts           # Join group by invite code
│   │       │   └── [groupId]/
│   │       │       ├── feed/route.ts       # Paginated activity feed
│   │       │       ├── leaderboard/route.ts # Group leaderboard (with period)
│   │       │       └── members/route.ts    # Members + currently reading
│   │       ├── leaderboard/route.ts        # Global leaderboard
│   │       ├── points/route.ts             # User points summary
│   │       ├── reviews/route.ts            # Create/list reviews
│   │       ├── recommendations/route.ts    # Book recommendations
│   │       └── users/
│   │           ├── search/route.ts         # Search users by username
│   │           └── [userId]/route.ts       # Get/update user profile
│   ├── components/
│   │   ├── Navbar.tsx              # Top nav with glass-morphism effect
│   │   ├── Spinner.tsx             # Loading spinner
│   │   ├── BookSearchResult.tsx    # Book search result card
│   │   ├── FeedItem.tsx            # Activity feed item with colored borders
│   │   ├── LeaderboardRow.tsx      # Ranked row with medals and rank titles
│   │   ├── GroupCard.tsx           # Group preview card
│   │   ├── ReviewCard.tsx          # Review display with spoiler toggle
│   │   ├── ReviewForm.tsx          # Modal: star rating + review text
│   │   └── StarRatingInput.tsx     # Clickable 5-star input
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser Supabase client
│   │   │   ├── server.ts           # Server Supabase client
│   │   │   └── middleware.ts       # Auth session refresh + redirect
│   │   ├── google-books.ts         # Google Books API (search + related volumes)
│   │   ├── points.ts               # Points calculation + streak tracking
│   │   ├── gamification.ts         # Rank tiers + badge checking
│   │   └── recommendations.ts      # Recommendation scoring engine
│   ├── hooks/
│   │   ├── useBooks.ts             # Book search, user books, start reading
│   │   ├── useGroups.ts            # Groups CRUD
│   │   ├── useReadingLogs.ts       # Log pages mutation
│   │   ├── useLeaderboard.ts       # Group leaderboard (with period)
│   │   ├── useGlobalLeaderboard.ts # Global leaderboard
│   │   ├── useFeed.ts              # Infinite-scroll activity feed
│   │   ├── useReviews.ts           # Book/user reviews, submit review
│   │   ├── useProfile.ts           # User profile + update
│   │   └── useRecommendations.ts   # Book recommendations
│   ├── types/index.ts              # All TypeScript interfaces
│   └── providers/QueryProvider.tsx  # TanStack Query provider
├── middleware.ts                    # Next.js auth middleware
├── .env.local                      # Environment variables
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Database Schema

### Entity Relationship Summary

```
users 1──M group_members M──1 groups
users 1──M user_books M──1 books
users 1──M reading_logs M──1 user_books
users 1──M points
users 1──M feed_events M──1 groups
users 1──M reviews M──1 books
users 1──M user_badges M──1 badge_definitions
```

### Tables

#### `users`
Synced from Supabase Auth via trigger on `auth.users` insert.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | References `auth.users.id` |
| username | text (unique) | Display name |
| avatar_url | text | Profile picture URL |
| bio | text | Max 200 chars |
| is_public | boolean | Default true |
| current_streak | int | Current consecutive reading days |
| longest_streak | int | All-time best streak |
| last_read_date | date | Last day user logged 10+ pages |
| created_at | timestamptz | |

#### `groups`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | Group display name |
| description | text | |
| invite_code | text (unique) | 6-char code for joining |
| created_by | uuid (FK users) | |
| created_at | timestamptz | |

#### `group_members`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| group_id | uuid (FK groups) | |
| user_id | uuid (FK users) | |
| joined_at | timestamptz | |
| **unique** | (group_id, user_id) | |

#### `books`
Cached from Google Books API on first lookup.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| google_books_id | text (unique) | Google Books volume ID |
| title | text | |
| author | text | |
| cover_url | text | |
| page_count | int | |
| genre | text | Primary genre/category |
| description | text | |
| rating | real | Google Books average rating |
| ratings_count | int | Google Books rating count |
| created_at | timestamptz | |

#### `user_books`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK users) | |
| book_id | uuid (FK books) | |
| status | text | `reading` or `finished` |
| current_page | int | Default 0 |
| started_at | timestamptz | |
| finished_at | timestamptz | Null until finished |
| **unique** | (user_id, book_id) | |

#### `reading_logs`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK users) | |
| user_book_id | uuid (FK user_books) | |
| pages_read | int | 1-100 per log |
| logged_at | timestamptz | |

#### `points`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK users) | |
| amount | int | Points earned |
| reason | text | `pages`, `finish_bonus`, `streak_bonus`, `review` |
| reference_id | uuid | ID of related entity |
| created_at | timestamptz | |

#### `feed_events`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK users) | |
| group_id | uuid (FK groups) | |
| event_type | text | `started_book`, `logged_pages`, `finished_book`, `streak`, `reviewed_book`, `earned_badge` |
| metadata | jsonb | Event-specific data |
| created_at | timestamptz | |

#### `reviews`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK users) | |
| book_id | uuid (FK books) | |
| rating | int | 1-5 stars |
| review_text | text | Max 500 chars, optional |
| has_spoilers | boolean | Default false |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| **unique** | (user_id, book_id) | One review per user per book |

#### `badge_definitions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text (unique) | Badge display name |
| description | text | How to earn it |
| icon | text | Unicode codepoint (hex) |
| category | text | `reading`, `streak`, `social`, `points` |
| threshold | int | Value needed to earn |

#### `user_badges`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK users) | |
| badge_id | uuid (FK badge_definitions) | |
| earned_at | timestamptz | |
| **unique** | (user_id, badge_id) | |

---

## API Routes

### Auth
Handled by Supabase Auth (email/password). Middleware redirects unauthenticated users to `/login`.

### Books & Reading

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/books/search?q=` | Proxy to Google Books API (English, with page counts) |
| GET | `/api/user-books` | List current user's books |
| POST | `/api/user-books` | Start reading `{ googleBooksId }` — caches book, creates user_book |
| POST | `/api/reading-logs` | Log pages `{ userBookId, pagesRead }` |
| GET | `/api/recommendations` | Personalized book recommendations |

### Groups

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/groups` | List user's groups |
| POST | `/api/groups` | Create group `{ name, description }` |
| POST | `/api/groups/join` | Join group `{ inviteCode }` (uses RPC) |
| GET | `/api/groups/[groupId]/feed` | Paginated activity feed |
| GET | `/api/groups/[groupId]/leaderboard?period=` | Group leaderboard (weekly/monthly/all) |
| GET | `/api/groups/[groupId]/members` | Members with currently reading books |

### Social

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/leaderboard?period=` | Global leaderboard |
| GET | `/api/reviews?bookId=` or `?userId=` | List reviews |
| POST | `/api/reviews` | Create/update review `{ bookId, rating, reviewText, hasSpoilers }` |
| GET | `/api/users/search?q=` | Search users by username |
| GET | `/api/users/[userId]` | Get user profile with stats, books, badges |
| PATCH | `/api/users/[userId]` | Update own profile `{ bio, is_public, username }` |

### Points

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/points` | Current user's points summary |

---

## Key Logic

### Points System

| Action | Points |
|--------|--------|
| Log pages | 1pt/page (max 100 page-points per calendar day) |
| Finish book | +50 pts |
| 3-day streak | +20 pts |
| 7-day streak | +50 pts |
| Submit review | +10 pts (first review per book only) |

### Rank Tiers

| Rank | Min Points |
|------|-----------|
| Bookworm | 0 |
| Page Turner | 100 |
| Chapter Chaser | 300 |
| Story Seeker | 600 |
| Novel Knight | 1,000 |
| Lore Master | 2,000 |
| Tome Titan | 3,500 |
| Library Legend | 5,000 |

### Streak Calculation

On each log submission:
1. Sum pages logged today for the user
2. If today's total >= 10 and `last_read_date != today`:
   - If `last_read_date == yesterday`: increment `current_streak`
   - Else: reset `current_streak = 1`
   - Update `last_read_date = today`
   - Update `longest_streak` if current > longest
3. Check if `current_streak` just hit 3 or 7 → award bonus + feed event

### Badge System

Badges are checked automatically after logging pages and submitting reviews. The system:
1. Fetches all badge definitions and user's existing badges
2. Calculates current stats (books read, streak, reviews, points, groups)
3. Awards any newly qualified badges
4. Creates feed events for earned badges

### Recommendation Engine

Scoring factors (recency-weighted):
- `genre_match` (5x) — matches user's recently read genres
- `related_volume` (3x) — Google Books related/associated volumes
- `author_match` (2x) — same authors user has read
- `rating` (2x) — Google Books average rating
- `group_popularity` (2x) — books popular in user's groups
- `similar_length` (1x) — page count within 20% of user's average
- `ratings_count` (1x) — number of ratings on Google Books
- `global_popularity` (1x) — read count across all Bookly users

Recency weighting: books read in last 7 days get 1.0x, 30 days 0.7x, 90 days 0.4x, older 0.2x.

Uses fuzzy title matching (`normalizeTitle`, `isSimilarTitle`) to avoid recommending books the user has already read.

### Reading Log Side Effects

On successful `POST /api/reading-logs`:
1. Update `user_books.current_page`
2. Award page points (1/page, 100/day cap)
3. Check & update streak
4. Award streak bonuses if milestone hit
5. Auto-finish book if pages reach total → award finish bonus
6. Create feed events for all user's groups
7. Check and award any new badges

---

## Auth Flow

1. User signs up/in via Supabase Auth (email + password)
2. Database trigger creates row in `users` table
3. Middleware checks auth on all routes except `/login` and `/auth/callback`
4. Supabase client uses the session token for RLS

---

## Row Level Security (RLS)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | All authenticated | Trigger only | Own row | Never |
| groups | Members or creator | Authenticated | Creator only | Never |
| group_members | Via `is_group_member()` | Authenticated | Never | Own membership |
| books | All authenticated | Authenticated | Never | Never |
| user_books | Own rows | Own rows | Own rows | Own rows |
| reading_logs | Own rows | Own rows | Never | Never |
| points | Own rows | Server only | Never | Never |
| feed_events | Group members | Server only | Never | Never |
| reviews | All authenticated | Authenticated | Own rows | Never |
| badge_definitions | All authenticated | Never | Never | Never |
| user_badges | All authenticated | Server only | Never | Never |

Security definer functions:
- `is_group_member(group_id, user_id)` — bypasses RLS recursion on group_members
- `find_group_by_invite_code(code)` — allows non-members to discover groups by invite code
