# J3AMP Fruit Inventory Management System

A role-based web application for managing fruit inventory, tracking stock levels, processing inbound and outbound transactions, and generating reports — built for warehouse and operations staff.

---

## Table of Contents
- [For Users](#for-users)
  - [What This System Does](#what-this-system-does)
  - [Roles & Access](#roles--access)
  - [How to Log In](#how-to-log-in)
  - [Features by Role](#features-by-role)
- [For Developers](#for-developers)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
  - [Environment Variables](#environment-variables)
  - [Available Scripts](#available-scripts)
  - [API Overview](#api-overview)

---

## For Users

### What This System Does
J3AMP is a web-based fruit inventory management system that allows warehouse staff to receive and dispatch stock, monitor inventory levels, manage user accounts, and generate date-range reports — all from a single platform accessible from any browser.

### Roles & Access
The system uses role-based access control. Each user is assigned one of three roles by an administrator upon account creation:

| Role     | Description                                                        |
|----------|--------------------------------------------------------------------|
| Admin    | Full access — manages users, generates reports, and views all data |
| Inbound  | Receives incoming stock and monitors inventory levels              |
| Outbound | Processes outgoing stock transactions and monitors inventory       |

### How to Log In
1. Open the app in your browser at `https://j3amp-fruit-inventory-management-sy-omega.vercel.app`
2. Enter your **username** and **password** provided by your administrator
3. You will be automatically redirected to your role's dashboard upon login

> If you forgot your password, contact your system administrator — they can reset it from the User Management page.

### Features by Role

**Admin**
- View and manage all system users
  - Create new accounts with assigned roles
  - Edit user details (name, email, phone, role, status)
  - Deactivate or reactivate existing accounts
  - Reset user passwords
- Generate inventory reports by custom date range
- Access all dashboards and inventory data

**Inbound**
- Receive incoming fruit stock by selecting a SKU, entering quantity (kg), expiration date, and supplier name
- View color-coded indicators on the SKU list:
  - 🟠 **Orange** — Low stock
  - 🔴 **Red** — Expiring soon
  - 🟣 **Purple** — Both low stock and expiring soon

**Outbound**
- Process outgoing stock transactions
- View current inventory levels and stock status

---

## For Developers

### Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React, React Router, plain CSS      |
| Backend  | Node.js, Express                    |
| Database | MySQL                               |
| Auth     | JWT stored in localStorage          |

### Project Structure

```
J3AMP/
├── client/                               # React frontend
│   ├── public/                           # Static public assets (favicon, manifest, etc.)
│   ├── build/                            # Production build output
│   └── src/
│       ├── App.js
│       ├── assets/
│       │   ├── backgrounds/              # SVG backgrounds for the login page
│       │   └── icons/                    # SVG icons used across the app
│       ├── components/
│       │   ├── NavigationBar.js          # Shared navigation bar component
│       │   ├── NotificationPanel.js      # Notification panel overlay
│       │   └── ProtectedRoute.js         # Route guard for role-based access control
│       ├── context/
│       │   └── AuthContext.js            # Global auth state, login logic, and role-based redirection
│       ├── pages/
│       │   ├── Login.js                  # Login page with role-based redirection
│       │   ├── admin/
│       │   │   └── BORequests.js         # Back-office requests page (admin only)
│       │   ├── dashboards/
│       │   │   ├── admin-dashboard.js    # Admin dashboard
│       │   │   ├── inbound-dashboard.js  # Inbound staff dashboard
│       │   │   └── outbound-dashboard.js # Outbound staff dashboard
│       │   ├── inventory/
│       │   │   ├── inventory-home.js     # Inventory list overview
│       │   │   └── inventory-item.js     # Individual inventory item detail
│       │   ├── logs-pages/
│       │   │   ├── admin-logs.js         # Transaction logs for admin
│       │   │   ├── inbound-logs.js       # Transaction logs for inbound staff
│       │   │   └── outbound-logs.js      # Transaction logs for outbound staff
│       │   ├── profile/
│       │   │   └── Profile.js            # User profile page
│       │   ├── reports/
│       │   │   ├── reports-home.js       # Reports landing page
│       │   │   ├── reports-generate.js   # Report generation form (admin only)
│       │   │   └── reports-view.js       # View generated reports
│       │   ├── transactions/
│       │   │   ├── receive-stock.js      # Inbound stock receiving form
│       │   │   ├── dispatch-stock.js     # Outbound stock dispatch form
│       │   │   └── BatchWriteOff.js      # Batch write-off form
│       │   └── users/
│       │       ├── Users.js              # User management page (admin only)
│       │       └── UserDetails.js        # Individual user detail page
│       └── services/
│           └── api.js                    # Axios API service layer
│
├── server/                               # Node.js / Express backend
│   ├── server.js                         # Entry point — sets up Express and mounts routes
│   ├── config/
│   │   └── database.js                   # MySQL connection configuration
│   ├── controllers/
│   │   ├── authController.js             # Login and token logic
│   │   ├── userController.js             # User CRUD and management
│   │   ├── inventoryController.js        # Inventory queries and updates
│   │   ├── transactionController.js      # Receive, dispatch, and write-off logic
│   │   ├── reportController.js           # Report generation
│   │   ├── alertController.js            # Low stock and expiry alert logic
│   │   └── boController.js               # Back-office request handling
│   ├── middleware/
│   │   ├── authMiddleware.js             # JWT verification and role enforcement
│   │   ├── errorHandler.js              # Global error handling middleware
│   │   └── validateRequest.js            # Request body validation
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── alertRoutes.js
│   │   ├── logRoutes.js
│   │   └── boRoutes.js
│   └── utils/
│       ├── logger.js                     # Server-side logging utility
│       └── validators.js                 # Reusable validation helpers
│
└── database/
    ├── schema-railway.mysql.sql          # Database schema
    └── seed-railway.mysql.sql            # Seed data for initial setup
```

### Getting Started

#### Prerequisites
- Node.js `>= 18.x`
- npm or yarn
- MySQL database set up and running
- Backend server configured and running

#### Installation

```bash
# 1. Clone the repository
git clone https://github.com/[your-username]/j3amp-inventory.git
cd j3amp-inventory

# 2. Install frontend dependencies
npm install

# 3. Create your environment file
cp .env.example .env

# 4. Start the development server
npm run dev
```

#### Backend Setup

```bash
# Navigate to the backend directory
cd server

# Install backend dependencies
npm install

# Import the database schema
mysql -u [your_user] -p [your_database] < database/schema-railway.mysql.sql

# (Optional) Seed initial data
mysql -u [your_user] -p [your_database] < database/seed-railway.mysql.sql

# Start the backend server
npm start
```

### Environment Variables

Create a `.env` file in the root of the project:

```env
VITE_API_BASE_URL=http://localhost:[port]/api
```

> Never commit your `.env` file. It is already listed in `.gitignore`.

### Available Scripts

| Command           | Description                         |
|-------------------|-------------------------------------|
| `npm run dev`     | Start the local development server  |
| `npm run build`   | Build the app for production        |
| `npm run preview` | Preview the production build        |

### API Overview

All API calls are handled through `src/services/api.js` using Axios. The following service modules are available:

| Module           | Description                                              |
|------------------|----------------------------------------------------------|
| `userAPI`        | Create, update, deactivate, reactivate, and reset users  |
| `inventoryAPI`   | Fetch SKU dropdown list and inventory data               |
| `transactionAPI` | Receive stock, dispatch stock, and batch write-offs      |
| `reportsAPI`     | Generate and view inventory reports by date range        |
| `alertAPI`       | Fetch low stock and expiring soon alerts                 |
| `boAPI`          | Submit and manage back-office requests                   |
| `logAPI`         | Fetch transaction logs per role                          |

Authentication is handled via JWT. The token is stored in `localStorage` and automatically attached to all outgoing requests through an Axios interceptor.

---

## Notes

- The app enforces role-based route protection — users are automatically redirected to their assigned dashboard on login and cannot access routes outside their role.
- Background scroll is locked whenever a modal is open (create user, edit user).
- All interactive buttons include a material-style ripple effect via the shared `useRipple` hook.
- SKU dropdowns display color-coded stock health indicators for quick visual identification.
- Date inputs are mobile-safe and capped to their container width on all screen sizes.

---

*Last updated: March 2026*
