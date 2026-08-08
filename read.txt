# Unified Cookscape 🍳

Unified Cookscape is a high-performance, full-stack business management platform designed to streamline internal operations, employee management, and financial workflows. Built with a modern architecture, it integrates real-time data visualization, automated reporting, and secure authentication to provide a seamless administrative experience.

## 🚀 Features

- **Advanced CRM (Walk-in Hub):** Track leads, manage visitor logs, and monitor conversion metrics.
- **Comprehensive HRMS:** Full employee lifecycle management, including documents, assets, and Background Verification (BGV).
- **Expense Hub:** Hierarchical voucher approval system (Submitted → AM Review → COO Review → Paid → Completed) with Excel export capabilities.
- **Automated Reporting:** Daily HR summaries and work reports with automated email triggers via Node-cron.
- **Interactive Dashboards:** Real-time analytics using Recharts and Framer Motion for fluid UI transitions.
- **Push Notifications:** Integrated Web-Push API for real-time browser alerts.
- **Geospatial Tracking:** Integrated Leaflet maps for location-based services.
- **Hybrid Authentication:** Secure login via JWT-based credentials and Google OAuth 2.0.

## 🛠 Tech Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS 4.0 (Modern utility-first CSS)
- **State/Routing:** React Router 7
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Data Viz:** Recharts

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **ORM:** Prisma (Type-safe database access)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **Services:** Google APIs (OAuth), Nodemailer (Email), Web-Push

### Database
- **Primary DB:** PostgreSQL (via Prisma)

## 📂 Folder Structure

```text
unified-cookscape/
├── server/                 # Backend Node.js Service
│   ├── prisma/             # Database Schema & Migrations
│   ├── src/
│   │   ├── config/         # Server configurations
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API Route definitions
│   │   └── app.js          # Entry point
│   └── package.json
├── src/                    # Frontend React Application
│   ├── features/           # Modularized feature folders (Admin, CRE, etc.)
│   │   ├── admin/          # Admin-specific components & pages
│   │   └── cre/            # CRE-specific workflows
│   ├── shared/             # Reusable components, hooks, and utils
│   ├── components/         # UI Design System
│   └── main.jsx            # Entry point
├── public/                 # Static assets & Service Workers
└── package.json            # Frontend dependencies
```

## 🔌 API Overview

| Endpoint | Method | Description | Auth |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | User authentication | Public |
| `/api/employees` | GET | Fetch all employee records | Admin |
| `/api/expenses` | POST | Submit new expense voucher | User |
| `/api/reports` | GET | Generate daily summary reports | Admin/AM |

## 🔮 Future Enhancements
- [ ] Mobile Application (React Native) integration.
- [ ] AI-driven lead conversion prediction.
- [ ] Multi-currency support for international operations.

## 📄 License
Internal Proprietary License - Cookscape.