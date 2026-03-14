# Bookly - Architecture Document

## Overview

Bookly is a social reading competition app. Users log pages read from books, earn points, and compete on group leaderboards. Built with Next.js + Supabase.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, TanStack Query |
| Backend | Supabase (Auth + Postgres + Row Level Security) |
| External | Google Books API |

---

## Folder Structure

```
bookly/
├── public/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (providers, nav)
│   │   ├── page.tsx                # Landing / redirect to dashboard
│   │   ├── login/
│   │   │   └── page.tsx            # Auth page (sign in / sign up)
│   │   ├── dashboard/
│   │   │   └── page.tsx            # User dashboard (current books, stats)
│   │   ├── groups/
│   │   │   ├── page.tsx            # List/join/create groups
│   │   │   └── [groupId]/
│   │   │       ├── page.tsx        # Group detail (feed + leaderboard)
│   │   │       └── leaderboard/
│   │   │           └── page.tsx    # Full leaderboard view
│   │   ├── books/
│   │   │   ├── page.tsx            # Book search (Google Books API)
│   │   │   └── [bookId]/
│   │   │       └── page.tsx        # Book detail + start reading
│   │   ├── my-books/
│   │   │   └── page.tsx            # User's reading list
│   │   ├── log/
│   │   │   └── page.tsx            # Log pages form
│   │   ├── recommendations/
│   │   │   └── page.tsx            # Book recommendations
│   │   └── api/
│   │       ├── books/
│   │       │   └── search/
│   │       │       └── route.ts    # Proxy Google Books API
│   │       ├── user-books/
│   │       │   ├── route.ts        # Start/finish book
│   │       │   └── [id]/
│   │       │       └── route.ts    # Update user_book
│   │       ├── reading-logs/
│   │       │   └── route.ts        # POST log pages
│   │       ├── groups/
│   │       │   ├── route.ts        # GET list, POST create
│   │       │   ├── join/
│   │       │   │   └── route.ts    # POST join group
│   │       │   └── [groupId]/
│   │       │       ├── feed/
│   │       │       │   └── route.ts    # GET activity feed
│   │       │       └── leaderboard/
│   │       │           └── route.ts    # GET leaderboard
│   │       ├── points/
│   │       │   └── route.ts        # GET user points summary
│   │       └── recommendations/
│   │           └── route.ts        # GET recommendations
│   ├── components/
│   │   ├── ui/                     # Reusable UI (Button, Card, Input, Modal)
│   │   ├── BookCard.tsx
│   │   ├── BookSearchResult.tsx
│   │   ├── FeedItem.tsx
│   │   ├── LeaderboardRow.tsx
│   │   ├── LogPagesForm.tsx
│   │   ├── GroupCard.tsx
│   │   ├── Navbar.tsx
│   │   ├── StreakBadge.tsx
│   │   └── PointsBadge.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser Supabase client
│   │   │   ├── server.ts           # Server Supabase client
│   │   │   └── middleware.ts       # Auth middleware
│   │   ├── google-books.ts         # Google Books API helpers
│   │   ├── points.ts               # Points calculation logic
│   │   └── recommendations.ts      # Recommendation scoring logic
│   ├── hooks/
│   │   ├── useBooks.ts             # TanStack Query hooks for books
│   │   ├── useGroups.ts            # TanStack Query hooks for groups
│   │   ├── useReadingLogs.ts       # TanStack Query hooks for logs
│   │   ├── useLeaderboard.ts
│   │   ├── useFeed.ts
│   │   └── useRecommendations.ts
│   ├── types/
│   │   └── index.ts                # All TypeScript types
│   └── providers/
│       └── QueryProvider.tsx        # TanStack Query provider
├── middleware.ts                    # Next.js middleware (auth redirect)
├── .env.local                      # Supabase keys, Google Books API key
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
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
```

### Tables

#### `users`
Synced from Supabase Auth. Created via trigger on `auth.users` insert.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | References `auth.users.id` |
| username | text (unique) | Display name |
| avatar_url | text | Profile picture |
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
| reason | text | `pages`, `finish_book`, `streak_3`, `streak_7` |
| reference_id | uuid | ID of reading_log or user_book |
| created_at | timestamptz | |

#### `feed_events`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK users) | |
| group_id | uuid (FK groups) | |
| event_type | text | `started_book`, `logged_pages`, `finished_book`, `streak` |
| metadata | jsonb | `{ bookTitle, pages, points, streakDays }` |
| created_at | timestamptz | |

---

## API Routes

### Auth
Handled entirely by Supabase Auth (email/password). No custom routes needed.

### Books

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/books/search?q=` | Proxy to Google Books API, caches results in `books` table |

### User Books

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/user-books` | List current user's books |
| POST | `/api/user-books` | Start reading a book `{ bookId }` |
| PATCH | `/api/user-books/[id]` | Finish a book `{ status: "finished" }` |

### Reading Logs

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/reading-logs` | Log pages `{ userBookId, pagesRead }` |

**Validation rules (enforced server-side):**
- `pagesRead` must be 1-100
- 1-hour cooldown between logs (check last log timestamp)
- Max 5 logs per day
- Cannot exceed book's total page count

**Side effects on successful log:**
1. Update `user_books.current_page`
2. Award page points (1 per page, max 100 page points/day)
3. Check & update streak
4. Award streak bonuses if milestone hit
5. Create `feed_event` for each group the user belongs to
6. If `current_page >= page_count`, auto-finish book + award finish bonus

### Groups

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/groups` | List user's groups |
| POST | `/api/groups` | Create group `{ name, description }` |
| POST | `/api/groups/join` | Join group `{ inviteCode }` |
| GET | `/api/groups/[groupId]/feed` | Get activity feed (paginated) |
| GET | `/api/groups/[groupId]/leaderboard` | Get leaderboard |

### Points

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/points` | Get current user's points summary |

### Recommendations

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/recommendations` | Get book recommendations for user |

---

## Key Logic

### Points System

```
Page points:     1 point per page logged (max 100 page-points per calendar day)
Finish bonus:    +50 points when book status changes to "finished"
Streak (3 days): +20 points
Streak (7 days): +50 points

Streak day = calendar day where user logged >= 10 pages total
```

Points are calculated and inserted server-side in the `POST /api/reading-logs` handler. The leaderboard query simply sums `points.amount` per user per group.

### Leaderboard Query

```sql
SELECT u.id, u.username, u.avatar_url, SUM(p.amount) as total_points
FROM points p
JOIN users u ON u.id = p.user_id
WHERE p.user_id IN (
  SELECT user_id FROM group_members WHERE group_id = $1
)
GROUP BY u.id, u.username, u.avatar_url
ORDER BY total_points DESC;
```

### Activity Feed

Simply query `feed_events` for the group, ordered by `created_at DESC`, with pagination (limit/offset). Join with `users` for display name and avatar.

### Recommendation Scoring

When a user requests recommendations:

1. Get user's genres from their `user_books` → `books.genre`
2. Get books popular in user's groups (books read by group members)
3. Score candidate books:

```
score =
    3 * genre_match       (1 if genre matches user's read genres, else 0)
  + 2 * similar_length    (1 if page_count within 20% of user's avg, else 0)
  + 3 * group_popularity  (count of group members reading/finished this book, normalized 0-1)
  + 1 * global_popularity (count of all users reading/finished this book, normalized 0-1)
```

4. Exclude books the user has already started/finished
5. Return top 10 by score

This runs as a single SQL query with scoring in the application layer.

### Streak Calculation

On each log submission:
1. Sum pages logged today for the user
2. If today's total >= 10 and `last_read_date != today`:
   - If `last_read_date == yesterday`: increment `current_streak`
   - Else: reset `current_streak = 1`
   - Update `last_read_date = today`
   - Update `longest_streak` if current > longest
3. Check if `current_streak` just hit 3 or 7 → award bonus

---

## Auth Flow

1. User signs up/in via Supabase Auth (email + password)
2. Trigger creates row in `users` table
3. Middleware checks auth on all routes except `/login`
4. Supabase client uses the session token for RLS

---

## Row Level Security (RLS) Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | All can read | Trigger only | Own row | Never |
| groups | Members only | Authenticated | Creator only | Never |
| group_members | Members of group | Authenticated | Never | Own membership |
| books | All can read | Authenticated | Never | Never |
| user_books | Own rows | Own rows | Own rows | Own rows |
| reading_logs | Own rows | Own rows | Never | Never |
| points | Own rows | Server only | Never | Never |
| feed_events | Group members | Server only | Never | Never |

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://sbgpancblydrgrpjedkp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_BDx9SKYTAyzWB3MCOXCCew_tpKN9p_4
GOOGLE_BOOKS_API_KEY=AIzaSyBAItrp_q2PJx65dP25EqLL5P61LL-dvNg
```

---

## Implementation Phases

### Phase 1: Project Setup & Auth
- Initialize Next.js project with TypeScript + TailwindCSS
- Install dependencies (TanStack Query, Supabase client libs)
- Set up Supabase clients (browser + server)
- Set up auth middleware
- Build login/signup page
- Set up TanStack Query provider
- Create basic layout with Navbar
- Create types file

### Phase 2: Groups
- Build create group page/form
- Build join group page (invite code)
- Build groups list page
- Build group detail page (shell for feed + leaderboard)
- API routes: create, join, list groups

### Phase 3: Book Search & Start Reading
- Set up Google Books API proxy route
- Build book search page with results
- Build book detail page
- Implement "Start Reading" flow (cache book in DB + create user_book)
- Build "My Books" page showing current reads

### Phase 4: Reading Logs & Points
- Build log pages form (select book, enter pages)
- Implement server-side validation (100 page max, 1hr cooldown, 5/day limit)
- Implement points calculation (page points with daily cap)
- Implement streak tracking and streak bonuses
- Implement auto-finish book when pages reach total
- Award finish bonus points

### Phase 5: Feed & Leaderboard
- Create feed events on each action (log, start, finish, streak milestone)
- Build feed UI component for group page
- Build leaderboard query and UI
- Add pagination to feed

### Phase 6: Recommendations & Dashboard
- Build recommendation scoring logic
- Build recommendations page
- Build user dashboard (current books, stats, streak display, points)

### Phase 7: Polish & Final Touches
- Loading states and error handling
- Empty states for all pages
- Mobile responsiveness pass
- UI polish (animations, transitions)
- Final testing
