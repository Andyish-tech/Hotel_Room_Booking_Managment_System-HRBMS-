# 🏨 Golden Stay Hotel — HRBMS

> **Hotel Room Booking Management System** — A full-stack web application for managing hotel room bookings, customer records, payments, and user accounts. Located in Huye District, Rwanda.

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## 📋 Table of Contents

- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Operations](#-api-operations)
- [Setup Instructions](#-setup-instructions)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Security](#-security)

---

## 🏗️ Project Structure

```
├── backend-project/          # Express.js Backend API
│   ├── Config/              # Database configuration
│   ├── Controller/          # Business logic (CRUD operations)
│   ├── Middleware/          # Auth & session middleware
│   ├── Routes/              # API route definitions
│   ├── server.js            # Entry point
│   └── seed.js              # Database seeder
├── frontend-project/         # React.js Frontend
│   ├── src/
│   │   ├── Components/     # Reusable UI components
│   │   │   ├── DataTable.jsx
│   │   │   ├── FormField.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── SecuritySettings.jsx
│   │   │   └── StatCard.jsx
│   │   ├── Pages/          # Page components (Dashboard, Bookings, etc.)
│   │   ├── Layout/         # AuthLayout & MainLayout
│   │   └── utils/          # API client, validation, toast helpers
│   └── tailwind.config.js  # TailwindCSS configuration
├── database/
│   ├── hrbms_schema.sql    # MySQL database schema
│   └── seed.sql            # Sample data
├── .gitignore              # Root gitignore
└── README.md               # This file
```

---

## 🗄️ Database Schema

### Entity-Relationship Diagram (Cardinalities)

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│   Room   │1────< │   Booking    │ >────1│ Customer │
└──────────┘       └──────┬───────┘       └──────────┘
                          │
                         1│
                          │
                    ┌─────▼──────┐       ┌──────────┐
                    │  Payment   │       │   User   │
                    └────────────┘       └────┬─────┘
                                              │1
                                              │
                                        ┌─────▼──────┐
                                        │  Security  │
                                        └────────────┘
```

### Tables

| Table | Primary Key | Foreign Keys |
|-------|------------|--------------|
| **Room** | `RoomNumber` | — |
| **Customer** | `CustomerID` | — |
| **User** | `UserID` | — |
| **Booking** | `BookingID` | `RoomNumber` → Room, `CustomerID` → Customer, `UserID` → User |
| **Payment** | `PaymentID` | `BookingID` → Booking |
| **Security** | `Sec_Id` | `UserId` → User |

### Relationships

| Relationship | Type | Description |
|---|---|---|
| Room → Booking | 1:N | One room can have many bookings (different dates) |
| Customer → Booking | 1:N | One customer can make multiple bookings |
| User → Booking | 1:N | One staff member can process many bookings |
| Booking → Payment | 1:N | One booking can have multiple payments (partial payments) |
| User → Security | 1:N | One user can set up multiple security questions |

---

## 🔐 API Operations

| Entity   | INSERT | SELECT | UPDATE | DELETE |
|----------|--------|--------|--------|--------|
| Room     | ✅     | ✅*    | ❌     | ❌     |
| Customer | ✅     | ✅*    | ❌     | ❌     |
| Booking  | ✅     | ✅     | ✅     | ✅     |
| Payment  | ✅     | ✅*    | ❌     | ❌     |
| User     | ✅     | ✅     | ✅     | ✅     |

> \*SELECT operations on Room, Customer, and Payment are used for data display and form dropdowns only.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/logout` | User logout |
| `GET`  | `/api/auth/me` | Get current session user |
| `GET`  | `/api/rooms` | List all rooms |
| `POST` | `/api/rooms` | Add a new room |
| `GET`  | `/api/customers` | List all customers |
| `POST` | `/api/customers` | Add a new customer |
| `GET`  | `/api/bookings` | List all bookings |
| `POST` | `/api/bookings` | Create a booking |
| `PUT`  | `/api/bookings/:id` | Update a booking |
| `DELETE` | `/api/bookings/:id` | Delete a booking |
| `GET`  | `/api/payments` | List all payments |
| `POST` | `/api/payments` | Record a payment |
| `GET`  | `/api/users` | List all users |
| `POST` | `/api/users` | Create a user (admin only) |
| `PUT`  | `/api/users/:id` | Update a user |
| `DELETE` | `/api/users/:id` | Delete a user (admin only) |
| `GET`  | `/api/health` | Health check |

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** v16 or later
- **MySQL Server** 8.x
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Hotel_Room_Booking_Managment_System-HRBMS-
```

### 2. Database Setup

```bash
# Log into MySQL and run the schema
mysql -u root -p < database/hrbms_schema.sql

# (Optional) Seed sample data
mysql -u root -p < database/seed.sql
```

### 3. Backend Setup

```bash
cd backend-project

# Install dependencies
npm install

# Create environment file
# Edit .env with your MySQL credentials
```

**.env example:**

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=HRBMS
PORT=5000
SESSION_SECRET=YourSecretKeyHere
```

```bash
# Start the backend server
npm start        # Production mode
npm run dev      # Development mode (with nodemon hot-reload)
```

### 4. Frontend Setup

```bash
cd frontend-project

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will start on **http://localhost:3000** and proxy API requests to the backend.

### 5. Create an Admin User

Once the backend is running, create your first administrator account:

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "FullName": "System Admin",
    "Username": "admin",
    "Email": "admin@goldenstayhotel.com",
    "Role": "admin",
    "Password": "Admin@123"
  }'
```

Then log in at http://localhost:3000/login with:
- **Username:** `admin`
- **Password:** `Admin@123`

---

## 🎨 Features

### Frontend
- **Interactive Dashboard** — Real-time statistics (total rooms, bookings, revenue)
- **Room Management** — View and manage room status (Available, Occupied, Maintenance)
- **Customer Registration** — Add and view customer records
- **Full Booking CRUD** — Create, read, update, and delete reservations with date conflict detection
- **Payment Recording** — Log payments and track revenue
- **User Management** — Admin-only user administration
- **Reports** — Printable booking reports using jspdf
- **Responsive UI** — Mobile-friendly design with TailwindCSS
- **Toast Notifications** — Real-time feedback with React Toastify
- **Session Persistence** — Maintains login state across page refreshes
- **Password Recovery** — Security question-based recovery flow

### Backend
- **RESTful API** — Clean, consistent API design
- **Session Auth** — Secure httpOnly cookie-based sessions
- **Role-Based Access** — Admin, Manager, and Staff roles with middleware protection
- **Password Hashing** — bcryptjs with configurable salt rounds
- **Input Validation** — Server-side validation for all endpoints
- **Error Handling** — Centralized error middleware

---

## 🛠️ Tech Stack

### Backend
| Library | Purpose |
|---------|---------|
| [Express.js](https://expressjs.com/) | Web framework |
| [MySQL2](https://github.com/sidorares/node-mysql2) | MySQL database driver |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Password hashing |
| [express-session](https://github.com/expressjs/session) | Session management |
| [cors](https://github.com/expressjs/cors) | Cross-origin requests |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variables |
| [nodemon](https://nodemon.io/) *(dev)* | Auto-restart on changes |

### Frontend
| Library | Purpose |
|---------|---------|
| [React 18](https://react.dev/) | UI framework |
| [React Router v6](https://reactrouter.com/) | Client-side routing |
| [Axios](https://axios-http.com/) | HTTP client |
| [TailwindCSS 3](https://tailwindcss.com/) | Utility-first CSS |
| [React Toastify](https://fkhadra.github.io/react-toastify/) | Toast notifications |
| [jspdf](https://github.com/parallax/jsPDF) | PDF report generation |
| [html2canvas](https://html2canvas.hertzen.com/) | DOM-to-canvas screenshots |

### Database
- **MySQL 8** with InnoDB engine for referential integrity

---

## 🔒 Security

- **Password Encryption**: bcryptjs with salt rounds = 10
- **Session Authentication**: express-session with `httpOnly` cookies
- **Role-Based Access Control**: Admin, Manager, and Staff roles
- **Route Protection**: Middleware checks authentication and role authorization
- **Account Recovery**: Security questions for password reset
- **Environment Variables**: Sensitive credentials stored in `.env` (gitignored)

---

## 👤 Author

**Andy Ishimwe**

---

## 📄 License

This project is for academic purposes — National Practical Exam
