# DocVault — Document Version Management System

## Quick Start (Local)

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### 1. Configure environment
Copy and edit the root `.env`:
```bash
cp .env.example .env
```

### 2. Run everything with Docker
```bash
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Postgres**: localhost:5432

### 3. Run locally without Docker (dev mode)

**Backend:**
```bash
cd backend
cp .env.example .env       # edit values
npm install
npx prisma migrate dev
npm run start:dev
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## Configuration

All configuration lives in `backend/.env`. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `STORAGE_DRIVER` | `local` or `s3` |
| `LOCAL_UPLOAD_DIR` | Path for local file storage |
| `AWS_S3_BUCKET` | S3 bucket name (when STORAGE_DRIVER=s3) |
| `AWS_REGION` | AWS region |
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `SMTP_HOST` | Email server host |
| `SMTP_PORT` | Email server port |
| `SMTP_USER` | Email username |
| `SMTP_PASS` | Email password |
| `SMTP_FROM` | Sender address |
| `NOTIFICATION_CHECK_CRON` | Cron schedule for deadline checks (default: every hour) |
| `APP_BASE_URL` | Public URL for email links |

## Switching to S3
Set `STORAGE_DRIVER=s3` and fill in the AWS variables. No code changes needed.

## Deploying to AWS EC2 / On-Premise
1. Install Docker + Docker Compose on the server
2. Clone the repo, set `.env` values
3. `docker compose up -d --build`
4. Point your domain/IP to port 80 (or use the nginx config included)

---

## Features
- Upload documents (any file type)
- Automatic version history per document
- Per-document notification settings (deadline date or recurring frequency)
- Email notifications sent to configured users
- 10-user roster managed via the Users page (no auth required)
- Download any version
- Delete documents
