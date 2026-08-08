# System Architecture - Unified Cookscape

## 🏗 Overview
Unified Cookscape follows a **Client-Server Architecture** with a clear separation of concerns. The system is designed for high availability and modular scalability, allowing independent updates to the frontend and backend services.

## 🛠 Component Breakdown

### 1. Frontend (React 19)
The frontend is a Single Page Application (SPA) built with Vite. It utilizes a **Feature-Based Architecture**, where logic is encapsulated within specific domains (e.g., `features/cre`, `features/admin`). 
- **State Management:** Localized state with Context API for global themes/auth.
- **UI System:** Tailwind CSS 4.0 for high-performance styling.

### 2. Backend (Express.js)
The backend acts as a RESTful API provider.
- **Controller-Service Pattern:** Separates business logic from request handling.
- **Middleware Layer:** Handles JWT verification, file uploads (Multer), and error logging.

### 3. Database Layer (PostgreSQL & Prisma)
- **Prisma ORM** provides a type-safe interface for PostgreSQL.
- **Schema Design:** Relational model optimized for complex joins (Employee ↔ Expenses ↔ Reports).

## 🔄 Data Flow (Step-by-Step)

1. **Request:** User interacts with the UI (e.g., submits an expense).
2. **Frontend Logic:** Axios interceptors attach the JWT from `localStorage` and send the request.
3. **Backend Middleware:** Express verifies the token and user roles.
4. **Business Logic:** The Controller processes the data, interacting with PostgreSQL via Prisma.
5. **Response:** Data is returned as JSON; UI updates reactively via Framer Motion.

## 🔐 Security Considerations
- **Password Hashing:** `bcryptjs` with a salt factor of 12.
- **JWT Protection:** Short-lived tokens with secure storage practices.
- **CORS Configuration:** Restricts API access to authorized domains only.
- **Input Validation:** Server-side sanitization to prevent SQL Injection and XSS.

## 🚀 Scalability
- **Stateless Backend:** Can be horizontally scaled using a Load Balancer (Nginx/AWS ELB).
- **Static Frontend:** Optimized build assets can be served via CDN (Vercel/Netlify).

---
### ASCII Architecture Diagram
```text
      [ User Browser ]
             |
             | (HTTPS / JSON)
             v
      [ Frontend: React/Vite ]
             |
             | (Axios / JWT)
             v
      [ Backend: Express.js ] <-----> [ Google OAuth ]
             |                <-----> [ Nodemailer/Web-Push ]
             |
      [ Prisma Client ]
             |
             v
      [ Database: PostgreSQL ]
```
