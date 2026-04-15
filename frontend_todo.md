# Frontend TODO — March Madness Picks UI

A focused checklist for building the web app needed to **make picks, manage brackets, and track results** against the existing backend.

---

## 🎯 Product Goal

Build a React/Vite frontend that lets users:
- register and log in
- create and edit their March Madness bracket picks
- review their saved brackets
- track pick accuracy as games finish
- view leaderboard / scoreboard standings
- manage profile and password settings

---

## ✅ Progress Update — 2026-04-08

Completed tonight:
- React/Vite app shell, routing, and protected navigation
- authentication flow with JWT persistence and session expiry handling
- bracket creation, viewing, pick selection, and save flow
- results tracking, leaderboard, and profile management pages
- reusable UI components plus responsive visual polish

Still next up:
- data normalization and input validation follow-up work
- a few nice-to-have product enhancements like auto-refresh and sharing

---

## 🔴 MVP — Required to Have a Working Frontend

### App Shell & Routing
- [x] Create `client/src/main.tsx`
- [x] Create `client/src/App.tsx`
- [x] Set up `react-router-dom` routes
- [x] Add a shared app layout with header, nav, and footer
- [x] Add a 404 / not-found page

### Authentication UI
- [x] Create `LoginPage`
- [x] Create `RegisterPage`
- [x] Create logout flow
- [x] Persist JWT in client state/storage safely
- [x] Add protected routes for authenticated pages
- [x] Show auth errors clearly in the UI

### API Integration
- [x] Create a shared `api.ts` client using `axios`
- [x] Automatically attach the JWT to authenticated requests
- [x] Add response interceptors for `401` / expired-session handling
- [x] Create typed services for:
  - [x] `authService.ts`
  - [x] `bracketService.ts`
  - [x] `scoreboardService.ts`
  - [x] `userService.ts`

### Bracket Management UI
- [x] Create a `BracketPage` for building picks
- [x] Create a `MyBracketsPage` to list saved brackets
- [x] Create a `BracketDetailsPage` to view/edit one bracket
- [x] Render tournament rounds and matchups visually
- [x] Let users select winners for each game
- [x] Prevent invalid edits once games are locked/completed
- [x] Save bracket picks to the backend
- [x] Support creating multiple named brackets if allowed

### Pick Tracking UI
- [x] Show pick status per game (`pending`, `correct`, `incorrect`)
- [x] Show total correct picks and points earned
- [x] Highlight completed games and winning teams
- [x] Add a “My Results” or “Track Picks” page
- [x] Refresh standings and results from live backend data

### Leaderboard / Scoreboard
- [x] Create a `LeaderboardPage`
- [x] Show rankings, total points, and correct picks
- [x] Highlight the current signed-in user
- [x] Support filtering by year if the backend supports it

---

## 🟠 Important UX & Product Improvements

### State Management
- [x] Create `AuthContext` for current-user session state
- [x] Add loading / error / empty states across pages
- [x] Decide whether to use plain React state, Context, or a store library

### Reusable Components
- [x] Build reusable UI components for:
  - [x] navigation bar
  - [x] auth forms
  - [x] bracket matchup card
  - [x] bracket round column
  - [x] leaderboard table
  - [x] loading spinner
  - [x] alert / toast messages

### Profile Management
- [x] Create `ProfilePage`
- [x] Add edit profile form
- [x] Add change-password form
- [x] Show success/error feedback for account updates

### Visual Design
- [x] Choose a styling approach (`CSS modules`, `Tailwind`, or plain CSS)
- [x] Add consistent spacing, colors, and typography
- [x] Make bracket layout readable on desktop and mobile
- [x] Add responsive navigation for small screens

---

## 🟡 Data Modeling / Frontend Types

- [x] Create shared TypeScript types for:
  - [x] `User`
  - [x] `AuthResponse`
  - [x] `Bracket`
  - [x] `Game`
  - [x] `ScoreboardEntry`
  - [x] `ApiError`
- [x] Align frontend types with backend response shapes
- [x] Normalize API data for easier bracket rendering

---

## 🟢 Testing & Quality

- [x] Add frontend lint config if needed for the client app
- [x] Add unit tests for core UI components
- [x] Add tests for auth flow and protected routing
- [x] Add integration tests for bracket submission and leaderboard display
- [x] Add basic accessibility checks for forms and navigation

---

## 🔐 Frontend Security & Reliability

- [x] Avoid exposing secrets in the client bundle
- [ ] Sanitize and validate user-entered values before submission
- [x] Handle expired or invalid JWTs gracefully
- [x] Show safe error messages without leaking backend internals
- [x] Add route guards for authenticated-only pages

---

## 🚀 Nice-to-Have Features

- [ ] Auto-refresh scores/leaderboard during live games
- [ ] Add a tournament overview dashboard
- [ ] Add badges for upset picks / perfect rounds
- [ ] Add dark mode
- [ ] Add bracket sharing / public view links
- [ ] Add printable bracket view

---

## Suggested Build Order

1. [ ] App shell + routing
2. [ ] Auth pages + JWT handling
3. [ ] API client + typed services
4. [ ] My Brackets list page
5. [ ] Bracket builder / editor UI
6. [ ] Results tracking page
7. [ ] Leaderboard page
8. [ ] Profile/settings page
9. [ ] Styling polish + responsiveness
10. [ ] Frontend testing
