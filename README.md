# Project Pilot — Smart Project & Task Collaboration System

Project Pilot is a full-stack, production-ready project management and real-time team collaboration platform. The system is designed with a modern modular backend, a polished responsive Next.js frontend with dark/light mode, role-based access controls, and live updates via WebSockets.

---

## 🚀 Key Features

- **Authentication & RBAC**: Role-based access control supporting **Admin**, **Project Manager (PM)**, and **Team Member** roles with secure JWT token rotation and httpOnly cookies.
- **Project & Task Management**: Full CRUD flows, project deadlines, task priority levels, assignees, and real-time status transitions.
- **Robust Validation**: Enforced schemas preventing duplicate task titles within a project, task updates by non-assigned team members, reassignment of completed tasks, and past date deadlines.
- **Dashboard & KPIs**: Real-time stats overview tracking compliance rate, total tasks, pending/completed tasks, and overdue tasks. Includes interactive charts for project progress, status distribution, and member workload.
- **Real-Time Collaboration**: Instant activity feeds, file attachments (via Cloudinary), task commenting, and live user notifications powered by Socket.io.
- **Dark/Light Mode**: Full theme customization persisted via `localStorage` with zero flashes of light theme (FOUC).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js (App Router, TypeScript)
- **Styling & UI**: Tailwind CSS, Shadcn UI, Lucide Icons
- **State & Real-time**: TanStack Query (React Query), React Hook Form, Zod, Socket.io Client, Recharts

### Backend
- **Framework**: Node.js, Express.js (TypeScript)
- **ORM & Database**: Prisma ORM, PostgreSQL (Neon)
- **Security**: JWT (Access/Refresh Tokens), bcryptjs, Express Rate Limit
- **Storage & WebSockets**: Multer, Cloudinary, Socket.io

---

## 📂 Project Structure

```
project_pilot/
├── client/                 # Next.js App Router Frontend
│   ├── src/
│   │   ├── app/           # Pages & Routes (auth, dashboard layout, settings)
│   │   ├── components/    # Reusable UI & Module Components
│   │   ├── services/      # API consumption services
│   │   └── types/         # TypeScript interfaces
├── server/                 # Express.js Backend
│   ├── src/
│   │   ├── app/
│   │   │   ├── middlewares/  # Auth, validation, rate limiter, error handlers
│   │   │   ├── modules/      # Feature modules (auth, project, task, user)
│   │   │   └── routes/       # Registering app routes
│   │   ├── socket/           # WebSocket real-time event managers
│   │   └── server.ts         # Server bootstrap entry point
│   ├── prisma/               # Database schemas & seed scripts
```

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/project_pilot?schema=public"

JWT_SECRET="your-jwt-access-secret"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_SECRET="your-jwt-refresh-secret"
REFRESH_TOKEN_EXPIRES_IN="30d"
SALT_ROUND=12

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

FRONTEND_URL="http://localhost:3000"
```

### Frontend (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
```

---

## 🔑 Demo Access Credentials

Pre-seeded credentials are provided for testing different system permissions:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@gmail.com` | `admin123` |
| **Project Manager** | `pm@gmail.com` | `pm12345` |
| **Team Member** | `member@gmail.com` | `member123` |

---

## 🏁 Setup & Installation

### Prerequisite
Ensure you have Node.js (v18+) and a running PostgreSQL instance (or Neon PostgreSQL URI).

### 1. Database Setup (Backend)
Navigate to the `server/` directory:
```bash
npm install
# Push Prisma schema and generate client
npx prisma generate
npx prisma db push
# Seed default roles & superadmin
npm run seed
```

### 2. Start Services

**Backend Server:**
```bash
npm run dev
```

**Frontend Client:**
```bash
# Navigate to client/ directory
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access Project Pilot.
