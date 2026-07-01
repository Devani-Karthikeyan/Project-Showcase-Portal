# Project Showcase Portal

A centralized platform designed to showcase university student projects, fostering collaboration, discovery, and networking. The portal serves as a bridge between students, lecturers, recruiters, and administrators.

## Features & User Roles

The platform is designed around four primary user roles, each with distinct privileges:

*   **🎓 Students**:
    *   Create, update, and manage their project portfolios.
    *   Upload project thumbnails and details.
    *   Archive/unarchive old projects.
    *   Follow other students and discover trending projects.
*   **👨‍🏫 Lecturers**:
    *   Review and grade student projects.
    *   Provide feedback on submissions.
    *   Approve projects for public or recruiter viewing.
    *   Access university-restricted projects.
*   **👔 Recruiters**:
    *   Discover top talent and innovative projects.
    *   "Like" projects to save them.
    *   Follow students to track their progress and portfolio updates.
*   **🛡️ Administrators**:
    *   Full platform management.
    *   Manage user accounts, roles, and activation status.
    *   Manage platform metadata (Universities, Degree Programs).
    *   View platform statistics and analytics.

## Tech Stack

### Frontend
*   **Framework**: React 19
*   **Build Tool**: Vite 8
*   **Styling**: Tailwind CSS 4
*   **Routing**: React Router DOM 6
*   **Icons**: Lucide React

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB (via Mongoose)
*   **Authentication**: Google OAuth & JWT
*   **File Uploads**: Multer (Local storage in `/uploads`)
*   **Real-time**: Server-Sent Events (SSE) for notifications

## Getting Started

### Prerequisites
*   Node.js (v18 or higher recommended)
*   MongoDB instance (local or Atlas)

### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `backend` directory with your configuration (e.g., `PORT`, `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`).
4.  Start the development server:
    ```bash
    npm run dev
    ```
    *The server runs on http://localhost:5000 by default.*

### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    *The frontend runs on http://localhost:5173 by default.*

## API Documentation
For detailed information about the REST endpoints, authentication, and authorization rules, please refer to the backend API documentation (available in the artifacts or `backend/src/routes`).

## Project Structure
```text
Project-Showcase-Portal/
├── backend/                # Express.js REST API
│   ├── src/
│   │   ├── config/         # Database and app configurations
│   │   ├── controllers/    # Route logic and handlers
│   │   ├── middleware/     # Auth, upload, and error middlewares
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express route definitions
│   │   └── services/       # Business logic (e.g., Notifications)
│   ├── uploads/            # Locally stored user uploads
│   └── package.json
├── frontend/               # React User Interface
│   ├── src/                
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Full page views
│   │   └── ...
│   └── package.json
└── README.md
```

## License
MIT License
