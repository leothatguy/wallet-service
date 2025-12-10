# Docker Setup Guide

This guide explains how to run the Wallet Service using Docker and Docker Compose.

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)

## Quick Start

### 1. Environment Setup

Copy the Docker environment template:

```bash
cp .env.docker .env
```

Edit `.env` and add your actual credentials:

- Google OAuth credentials
- JWT secret (minimum 256 bits)
- Paystack API keys
- API key encryption secret

### 2. Start Services

**Development mode** (with hot reload):

```bash
docker-compose up
```

Or run in detached mode:

```bash
docker-compose up -d
```

**Production mode**:

```bash
BUILD_TARGET=production docker-compose up -d
```

### 3. Access Services

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **pgAdmin** (if enabled): http://localhost:5050

## Available Commands

### Build and Start

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Start in background
docker-compose up -d

# Rebuild and start
docker-compose up --build
```

### Manage Services

```bash
# Stop services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# View logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
```

### Database Management

```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U wallet_user -d wallet_db

# Run migrations
docker-compose exec app npm run migration:run

# Generate migration
docker-compose exec app npm run migration:generate -- -n MigrationName

# Revert migration
docker-compose exec app npm run migration:revert
```

### Application Commands

```bash
# Access app container shell
docker-compose exec app sh

# Install new package
docker-compose exec app npm install package-name

# Run tests
docker-compose exec app npm test

# Run linter
docker-compose exec app npm run lint
```

## Using pgAdmin

pgAdmin is available as an optional service for database management.

### Enable pgAdmin

```bash
docker-compose --profile tools up -d
```

### Access pgAdmin

1. Navigate to http://localhost:5050
2. Login with credentials from `.env`:
   - Email: `admin@wallet.com` (or your custom value)
   - Password: `admin` (or your custom value)

### Connect to PostgreSQL

Add a new server in pgAdmin:

- **General > Name**: Wallet Service DB
- **Connection > Host**: `postgres`
- **Connection > Port**: `5432`
- **Connection > Username**: `wallet_user` (from .env)
- **Connection > Password**: `wallet_password` (from .env)
- **Connection > Database**: `wallet_db` (from .env)

## Environment Variables

### Required Variables

| Variable               | Description                   | Example                                    |
| ---------------------- | ----------------------------- | ------------------------------------------ |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID        | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret    | `GOCSPX-abc123`                            |
| `JWT_SECRET`           | Secret for JWT signing        | `min-256-bit-secure-random-string`         |
| `PAYSTACK_SECRET_KEY`  | Paystack secret key           | `sk_test_...`                              |
| `PAYSTACK_PUBLIC_KEY`  | Paystack public key           | `pk_test_...`                              |
| `API_KEY_SECRET`       | Secret for API key encryption | `secure-random-string`                     |

### Optional Variables

| Variable            | Description        | Default           |
| ------------------- | ------------------ | ----------------- |
| `NODE_ENV`          | Environment mode   | `development`     |
| `PORT`              | Application port   | `3000`            |
| `POSTGRES_USER`     | Database username  | `wallet_user`     |
| `POSTGRES_PASSWORD` | Database password  | `wallet_password` |
| `POSTGRES_DB`       | Database name      | `wallet_db`       |
| `BUILD_TARGET`      | Docker build stage | `development`     |

## Troubleshooting

### Port Already in Use

If port 3000 or 5432 is already in use, change it in `.env`:

```bash
PORT=3001
POSTGRES_PORT=5433
```

### Database Connection Issues

Check if PostgreSQL is healthy:

```bash
docker-compose ps
docker-compose logs postgres
```

### Clear Everything and Restart

```bash
# Stop all services and remove volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose up --build
```

### Hot Reload Not Working

Ensure volumes are properly mounted:

```bash
docker-compose down
docker-compose up --build
```

## Production Deployment

For production deployment:

1. Update `.env` with production values:

   ```bash
   NODE_ENV=production
   BUILD_TARGET=production
   DATABASE_URL=postgresql://user:pass@production-host:5432/db
   ```

2. Build production image:

   ```bash
   docker-compose build
   ```

3. Start services:

   ```bash
   docker-compose up -d
   ```

4. Set up SSL/TLS termination with a reverse proxy (nginx, Traefik, etc.)

## Security Notes

- **Never commit** `.env` files with real credentials
- Use strong passwords for production databases
- Enable SSL for PostgreSQL in production
- Use secrets management for production deployments
- Regularly update base images for security patches

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
