# Cookscape Enterprise Platform

[![Status](https://img.shields.io/badge/Status-Active-success.svg)]
[![Frontend](https://img.shields.io/badge/Frontend-React%20(Vite)-61DAFB.svg)]
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%26%20Express-339933.svg)]
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)]

A centralized Enterprise Management Platform developed for **Cookscape Interiors** that manages the complete business workflow from lead generation to project completion.

The platform combines **CRM, Project Management, Employee Management, Client Portal, Task Tracking, Issue Management, Reports, Chat, and Email** into a single application.

---

# Business Workflow

```text
Lead / Walk-in
      │
      ▼
CRM
      │
      ▼
Client Confirmation
      │
      ▼
Project Creation
      │
      ▼
Assign Business Head
Assign Supervisor
Assign Employees
      │
      ▼
Task Planning
      │
      ▼
Daily Progress Updates
      │
      ▼
Issue Tracking
      │
      ▼
Client Portal
      │
      ▼
Project Completion
```

---

# Modules

## Dashboard

Displays real-time business statistics.

- Total Projects
- Open Projects
- Closed Projects
- Open Tasks
- Closed Tasks
- Open Issues
- Closed Issues
- Overdue Projects
- Overdue Tasks

---

## CRM

Manage customer leads.

Features

- Walk-in Management
- Lead Tracking
- Customer Details
- Conversion Tracking

---

## Project Management

Once the client confirms the quotation, a project is created.

Each project contains

- Project Name
- Project Code
- Client Details
- Site Location
- Budget
- Project Type
- Start Date
- Deadline
- Business Head
- Supervisor
- Assigned Employees
- Project Status
- Payment Progress

Features

- Create Project
- Edit Project
- Bulk Import
- Search
- Filters
- Grid/List View
- Progress Tracking

---

## Task Management

Tasks are created for each project.

Each task contains

- Task Name
- Assigned Employee
- Priority
- Deadline
- Status
- Progress
- Notes

Supports

- Pending
- In Progress
- Completed
- Overdue

---

## Issue Management

Track project issues and bugs.

Features

- Create Issues
- Assign Issues
- Priority Levels
- Resolution Tracking
- Status Updates

---

## Client Portal

One of the major features of the application.

The admin can generate a secure access link for each client.

Clients can

- View Project Progress
- Track Tasks
- View Timeline
- View Documents
- Raise Queries
- Monitor Site Progress

without logging into the admin dashboard.

---

## Employee Management

Manage employees working on projects.

Features

- Employee Profiles
- Project Assignment
- Task Assignment
- Department
- Role Management

---

## Communication

Internal communication system.

- Chat
- Email
- Notifications

---

## CRE Reports

Generate business reports.

Includes

- Walk-in Reports
- Monthly Reports
- Branch Reports
- CRE Performance

---

# User Roles

| Role | Access |
|------|--------|
| Super Admin | Complete System |
| Admin | Projects, Employees, Reports |
| Business Head | Assigned Projects |
| Supervisor | Site Progress & Tasks |
| Employee | Assigned Tasks |
| CRE | CRM & Reports |
| Client | Client Portal |

---

# Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Framer Motion
- Recharts
- Lucide React

## Backend

- Node.js
- Express.js
- Prisma ORM

## Database

- PostgreSQL

## Authentication

- JWT
- Google OAuth

## Other Services

- Nodemailer
- Web Push Notifications

---

# Folder Structure

```
cookscape-enterprise/

├── server/
│
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── jobs/
│   │   ├── uploads/
│   │   ├── app.js
│   │   └── server.js
│   │
│   └── package.json
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── api/
│   ├── utils/
│   ├── features/
│   │   ├── admin/
│   │   ├── employee/
│   │   ├── supervisor/
│   │   ├── client/
│   │   └── cre/
│   ├── App.jsx
│   └── main.jsx
│
├── public/
├── package.json
├── README.md
└── .env
```

---

# Installation

## Backend

```bash
cd server
npm install
npm run dev
```

Runs on

```
http://localhost:5000
```

---

## Frontend

```bash
npm install
npm run dev
```

Runs on

```
http://localhost:5173
```

---

# Environment Variables

Backend

```env
PORT=5000

DATABASE_URL=

JWT_SECRET=

EMAIL_USER=

EMAIL_PASS=

GOOGLE_CLIENT_ID=
```

Frontend

```env
VITE_API_URL=http://localhost:5000/api

VITE_GOOGLE_CLIENT_ID=
```

---

# Future Enhancements

- Mobile Application
- Attendance Module
- Payroll Module
- AI Reports
- Live Project Tracking
- Mobile Notifications

---

# License

Internal Proprietary Software

Developed for Cookscape Interiors.

© 2026 Cookscape Enterprise Platform.