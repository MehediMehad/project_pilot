# Project Pilot - Frontend Client Agent Guidelines

Welcome, Frontend Agent. You are tasked with developing and maintaining the Next.js client-side application for Project Pilot.

## Tech Stack & Core Libraries
- **Framework**: Next.js (App Router, Turbopack, React 19)
- **Styling**: TailwindCSS & custom styles
- **Icons**: Lucide React
- **Real-Time Client**: Socket.io-client via `SocketContext`
- **State & Data Fetching**: React Hooks (useState, useEffect, useTransition) and Server Actions/Services

---

## Folder Directory Structure
Always follow the modular frontend architecture:
```
client/
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router (pages & layouts)
│   │   ├── (auth)/       # Auth pages (login, register, forgot-password)
│   │   └── (dashboardLayout)/ # Dashboard pages wrapper per role
│   ├── components/
│   │   ├── layout/       # Sidebars, Navbars, Header dropdowns
│   │   ├── modules/      # Page-specific components (Admin, Project, Task, Common)
│   │   └── ui/           # Reusable shadcn UI primitives (Button, Table, Select, etc.)
│   ├── contexts/         # React Contexts (SocketContext, AuthContext)
│   ├── lib/              # Core utilities & auth-utils helper
│   ├── services/         # Client services/actions grouping API calls
│   └── types/            # TypeScript interfaces
```

---

## Coding & UI Standards

### 1. Modern Glassmorphic Design Aesthetics
- The dashboard is built with a sleek dark/light mode theme emphasizing a premium appearance.
- Use glassmorphism classes:
  - Background: `bg-card/65 dark:bg-slate-900/50 backdrop-blur-md`
  - Borders: `border border-border dark:border-slate-700/60`
  - Cards: `rounded-2xl shadow-2xs`

### 2. Form Controls & Dropdowns
- **NEVER** use native HTML browser `<select>` elements.
- Always use the custom Radix-UI-backed shadcn `Select` component:
```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```

### 3. Unified Pagination Best Practices
- Tables and list grids (e.g., User Management, Projects, Task Workspace, Activities Feed) must use the **Advanced Pagination Row** system:
  - Displays dynamic numbered page buttons with ellipses (`1 2 3 ... 10`).
  - Next/Previous buttons.
  - Rows per page dropdown (`Select`).
  - Total item counters (e.g. `Showing 1 to 10 of 100 items`).
- **Rows per Page Multiples Rules**:
  - For tabular columns (like users): Multiples of 5 or 10 (`[5, 10, 20, 50, 100]`).
  - For 4-column card layouts (like Projects): Multiples of 4 (`[4, 8, 12, 24, 48]`).
  - For 3-column card layouts (like Tasks): Multiples of 3 (`[6, 9, 12, 18, 30]`).

### 4. Real-time Notifications & Events
- Consume the `useSocket` context for reactive subscriptions to socket events.
- On click, make sure unread notifications trigger `markAsRead(id)` to update the live indicators.
- Live updates should automatically re-fetch underlying lists (e.g., revalidate tags or fire `fetchProjects()` via socket listeners).
