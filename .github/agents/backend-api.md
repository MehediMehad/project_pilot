# Project Pilot - Backend API Agent Guidelines

Welcome, Backend Agent. You are tasked with developing and maintaining the Node.js, Express, TypeScript, and Prisma-backed backend services for Project Pilot.

## Tech Stack & Core Libraries
- **Runtime & Language**: Node.js, TypeScript
- **Framework**: Express.js
- **ORM & Database**: Prisma with PostgreSQL
- **Real-Time Communication**: Socket.io (WebSocket notifications)
- **Utilities**: `zod` (Validation), `jsonwebtoken` (Auth), `bcrypt` (Hashing)

---

## Folder Directory Structure
Always follow the modular architecture:
```
server/
├── prisma/
│   └── schema.prisma         # Database schemas
├── src/
│   ├── app/
│   │   ├── config/           # Environment and config variables
│   │   ├── errors/           # Global error handling classes
│   │   ├── middlewares/      # Auth, global error, & request validation middlewares
│   │   ├── modules/          # Business logic modules (User, Project, Task, Comment, Activity, Notification)
│   │   │   └── <module_name>/
│   │   │       ├── <module>.interface.ts
│   │   │       ├── <module>.controller.ts
│   │   │       ├── <module>.service.ts
│   │   │       ├── <module>.route.ts
│   │   │       └── <module>.validation.ts
│   │   ├── routes/           # Global router combining all modules
│   │   └── utils/            # Shared utilities (sendResponse, catchAsync)
│   ├── app.ts                # Express app setup
│   └── server.ts             # Port setup & WebSocket server startup
```

---

## Coding Standards & Best Practices

### 1. Controllers & Request Handling
- Always wrap controller controllers inside the `catchAsync` utility to avoid unhandled promise rejections.
- Standard response format should always use `sendResponse`:
```typescript
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

const getAllItems = catchAsync(async (req: Request, res: Response) => {
  const result = await MyService.getAllItemsFromDB(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Items retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});
```

### 2. Validation with Zod
- Every incoming payload (body, query, params) must be validated before entering the controller.
- Use the `validateRequest` middleware:
```typescript
import { z } from 'zod';
const createValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
  }),
});
```

### 3. Database Operations with Prisma
- Use clean, transactional queries when performing multiple mutations.
- Paginated queries should leverage `paginationHelper` to extract `page`, `limit`, and `skip` uniformly.
- Leverage Prisma select select clauses to avoid leaking sensitive fields (e.g. `password`).

### 4. Real-time Events (Socket.io)
- When mutation actions happen (e.g., project added, task status updated), emit socket events on the global socket IO server helper.
- Standard namespaces/event names:
  - `project:added` / `project:updated` / `project:removed`
  - `task:added` / `task:updated` / `task:removed`
  - `notification:received`

### 5. Error Handling
- Never throw raw strings or generic Error objects.
- Use `AppError` class with appropriate HTTP status codes (e.g., 400, 401, 403, 404).
