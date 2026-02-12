
# Pinnacle 6 - Conversational SIEM Assistant

**An AI-powered security assistant for automated threat investigation and reporting using NLP.**

This project is developed for the **Pinnacle 6** subject. It leverages a modern full-stack architecture to provide a conversational interface for security analysts, enabling them to investigate threats and generate automated reports efficiently.

Built on a robust foundation of **Next.js 16**, **FastAPI**, and **PostgreSQL**, this application implements the **BFF (Backend for Frontend)** pattern to ensure secure and scalable performance.

---

## 🚀 Features

*   **Conversational Interface**: Natural Language Processing (NLP) powered chat for querying security data.
*   **Automated Threat Reporting**: Generate detailed incident reports automatically.
*   **Investigation Assistant**: Context-aware AI to guide analysts through security events.
*   **Modern Tech Stack**:
    *   **Frontend**: Next.js 16 (App Router), TailwindCSS v4, TypeScript.
    *   **Backend**: Python 3.10, FastAPI, SQLAlchemy (Async), Pydantic.
    *   **Database**: PostgreSQL 15.
    *   **Authentication**: [Better Auth](https://better-auth.com).
*   **Infrastructure**: Docker Compose (Local), Azure Container Apps (Production).

---

## 🛠 Prerequisites

*   **Docker Desktop** (Must be running)
*   **Git**
*   **Make** (Optional, recommended for shortcut commands)
*   **Node.js 20+** (Optional, for local tooling/intellisense)
*   **Python 3.10+** (Optional, for local tooling/intellisense)

---

## ⚡ Quick Start

### 1. Configure Environment
Copy the example environment files. The defaults are pre-configured for local Docker development.

```bash
# Root directory (Main config)
cp .env.example .env

# Generate a secure key (Mac/Linux)
openssl rand -hex 32
# Copy the output and paste it as INTERNAL_API_KEY in your .env file

# Deployment directory (Only for Azure production)
cp deployment/prod.env.example deployment/prod.env
```

### 2. Start the Stack
We use a `Makefile` to simplify Docker commands.

```bash
make up
```
*Alternatively: `docker compose up --build -d`*

### 3. Access the App
*   **Frontend**: [http://localhost:3000](http://localhost:3000)
    *   *Sign in to access the Dashboard.*
*   **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
*   **Database (Postgres)**: `localhost:5432`
    *   **User**: `pinnacle`
    *   **Password**: `your_secure_password_here`
    *   **DB**: `pinnacle_db`

---

## 🏗 Architecture Overview

This project uses a **Split-Stack Architecture**:

1.  **Next.js (Port 3000)**:
    *   Handles UI, Authentication, and Session Management.
    *   Owns "Identity" tables: `user`, `session`, `organization`, `account`.
    *   Acts as a proxy for the Python backend using Server Actions.

2.  **FastAPI (Port 8000)**:
    *   Handles Business Logic, NLP Processing, and Data Analysis.
    *   Owns "Business" tables.
    *   Runs in a secure internal network.

3.  **Secure Communication**:
    *   The frontend uses a universal API client to talk to Python.
    *   **Authentication**: Next.js verifies the user session, then forwards the request with:
        *   `X-User-ID`: The authenticated user's ID.
        *   `X-Internal-Api-Key`: A shared secret to prove the request came from the Frontend.

---

## 🗄 Database & Migrations

We use two ORMs for different concerns.

### 1. Auth Tables (Drizzle ORM)
Located in `frontend/src/db/schema.ts`.

**To update Auth schema:**
```bash
make db-migrate-frontend
```

### 2. Business Tables (SQLAlchemy + Alembic)
Located in `backend/app/models.py`.

**To update Business schema:**
1.  Edit `backend/app/models.py`.
2.  Generate a migration file:
    ```bash
    make db-migration-backend msg="describe_change"
    ```
3.  Apply the migration:
    ```bash
    make db-migrate-backend
    ```

### 3. Sync Everything
To apply both frontend and backend migrations at once:
```bash
make db-migrate
```

---

## 💻 Building Features

### 1. Define Backend Model (Python)
Create SQLAlchemy models in `backend/app/models.py` for new entities (e.g., `Incident`, `Report`).

### 2. Create API Endpoint (Python)
Implement FastAPI endpoints in `backend/app/main.py` to handle logic and data processing.

### 3. Create Frontend Action (TypeScript)
Use Server Actions in `frontend/src/app/actions.ts` to securely call the backend API.

---

## ☁️ Deployment (Azure)

The project includes an automated deployment script for **Azure Container Apps**.

### Deployment Commands
Use the `Makefile` for step-by-step deployment:

```bash
# 1. Setup Infrastructure
make deploy-setup

# 2. Build & Push Docker Images
make deploy-build

# 3. Deploy Containers to Azure
make deploy-push

# 4. Run Migrations
make deploy-migrate
```

**One-shot Deploy:**
```bash
make deploy-all
```

---

## 📂 Directory Structure

```text
├── backend/                # Python FastAPI Service (NLP & Logic)
│   ├── alembic/            # DB Migrations
│   ├── app/                # Application Code
│   │   ├── main.py         # Entrypoint & Routes
│   │   ├── models.py       # Database Models
│   │   ├── schemas.py      # Pydantic Schemas
│   │   └── deps.py         # Dependencies
│   └── Dockerfile
├── frontend/               # Next.js Application (UI & Auth)
│   ├── src/
│   │   ├── app/            # App Router
│   │   ├── db/             # Drizzle Schema
│   │   ├── lib/            # Utilities
│   └── Dockerfile
├── deployment/             # Azure Deployment Scripts
├── docker-compose.yml      # Local Development Orchestration
└── Makefile                # Command Shortcuts
```

## 🐛 Troubleshooting

*   **Drizzle Connection Refused**: Ensure you use `localhost:5432` for local connections and `db:5432` inside Docker.
*   **Port Conflicts**: Check ports 3000 and 8000.
*   **Hot Reloading**: Restart specific containers if changes don't reflect: `docker compose restart frontend`.

## 📜 License
Open Source.