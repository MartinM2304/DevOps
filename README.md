# Requirements Management System

A web-based system University WEB project for tracking functional and non-functional project requirements. Built with PHP backend and vanilla JavaScript frontend, containerized with Docker and deployable to Kubernetes.

## Prerequisites

- **Docker** and **Docker Compose** (for containerized development)
- **PHP 8.1+** (for local development without Docker)
- **Composer** (PHP dependency manager)
- **MySQL 8.0+** (or use Docker)
- **kubectl** and **k3d** (for Kubernetes deployment testing)

## Local dev with Docker

### 1. Start the Application

```bash
docker-compose up -d
```

This will:
- Build the PHP application container
- Start MySQL 8.0 database
- Run database migrations automatically
- Start the web server on port 8000

### 2. Access the Application

Open your browser and navigate to:
```
http://localhost:8000/frontend
```

## Tests

### Run All Tests

```bash
composer test
```

### Run Unit Tests Only

```bash
composer run test:unit
# or
php vendor/bin/phpunit --testsuite Unit
```

### Run Integration Tests

```bash
export DB_HOST=127.0.0.1
export DB_NAME=requirements_db
export DB_USER=root
export DB_PASS=root

composer run test:integration
# or
php vendor/bin/phpunit --testsuite Integration
```

### Code Quality Checks

```bash
# Run PHP CodeSniffer (PSR-12 standard)
composer run lint
# or
vendor/bin/phpcs --standard=PSR12 src/
```

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment. The pipeline includes:

### Jobs

1. **Quality Check**
   - PHP code quality checks (PSR-12)
   - Unit tests
   - SonarQube static analysis

2. **Build & Push**
   - Docker image build
   - Push to DockerHub (on main branch)

3. **Integration Tests**
   - Database migrations
   - Integration test suite

4. **Deploy to k3d**
   - Kubernetes deployment to k3d cluster
   - Deployment verification

### View Pipeline Status

Check the "Actions" tab in your GitHub repository to see pipeline runs and results.

## Kubernetes Deployment

### Prerequisites

- `kubectl` installed
- `k3d` installed (for local testing)

### Local Kubernetes Testing (k3d)

```bash
# Install k3d
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

# Create cluster
k3d cluster create my-cluster \
  --port 8000:80@loadbalancer \
  --k3s-arg "--disable=traefik@server:*"

# Build Docker image
docker build -f docker/Dockerfile -t requirements-app:latest .

# Import image into k3d
k3d image import requirements-app:latest -c my-cluster

# Deploy database
kubectl apply -f k8s/db-deployment.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=db --timeout=120s

# Deploy application
kubectl apply -f k8s/app-deployment.yaml

# Check deployment status
kubectl rollout status deployment/requirements-app --timeout=120s

# Verify pods
kubectl get pods
kubectl get services

# Access the application
# http://localhost:8000

# Cleanup
k3d cluster delete my-cluster
```

### Production Deployment

```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/

# Check deployment
kubectl get deployments
kubectl get services
kubectl get pods
```

## Project Structure

```
.
├── src/                      # Application source code
│   ├── backend/              # PHP backend
│   │   ├── api/              # API endpoints
│   │   │   ├── users.php
│   │   │   ├── projects.php
│   │   │   ├── requirements.php
│   │   │   └── ...
│   │   ├── core/             # Core functionality
│   │   │   ├── db.php        # Database connection
│   │   │   └── router.php    # Routing logic
│   │   └── models/           # Data models
│   └── frontend/             # Frontend application
│       ├── index.html        # Main HTML file
│       ├── css/               # Stylesheets
│       └── js/                # JavaScript files
├── database/                  # Database files
│   ├── migrate.php           # Migration runner
│   ├── migrations/           # SQL migration files
│   │   ├── 001_initial_schema.sql
│   │   └── 002_sample_data.sql
│   └── schema.sql            # Database schema
├── docker/                    # Docker configuration
│   └── Dockerfile            # Application Dockerfile
├── k8s/                      # Kubernetes manifests
│   ├── app-deployment.yaml   # Application deployment
│   ├── db-deployment.yaml    # Database deployment
│   └── migration-job.yaml    # Migration job
├── tests/                     # Test files
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── .github/
│   └── workflows/
│       └── ci-cd.yml         # CI/CD pipeline
├── docker-compose.yml        # Docker Compose configuration
├── composer.json             # PHP dependencies
└── phpunit.xml               # PHPUnit configuration
```

## Environment Variables

The application uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_NAME` | Database name | `requirements_db` |
| `DB_USER` | Database user | `root` |
| `DB_PASS` | Database password | (empty) |

## Database Migrations

The project uses a custom migration system similar to Flyway. Migrations are automatically run:

- **Docker Compose**: Via the `migrate` service
- **Kubernetes**: Via init containers in the deployment
- **Manual**: Run `php database/migrate.php`

Migrations are stored in `database/migrations/` and are executed in alphabetical order. Applied migrations are tracked in the `schema_migrations` table.

## Troubleshooting

### Port 3306 Already in Use

If you get an error about port 3306 being allocated:

**Option 1**: Change the MySQL port in `docker-compose.yml`:
```yaml
ports:
  - "3307:3306"  # Use 3307 instead of 3306
```

**Option 2**: Stop the conflicting MySQL service:
```bash
# macOS (Homebrew)
brew services stop mysql

# Linux
sudo systemctl stop mysql
```

### Application Not Accessible

1. **Check container status**:
   ```bash
   docker-compose ps
   ```

2. **Check logs**:
   ```bash
   docker-compose logs app
   ```

3. **Verify port mapping**:
   ```bash
   docker-compose port app 80
   ```

4. **Test from inside container**:
   ```bash
   docker-compose exec app curl http://localhost/
   ```

### Database Connection Issues

1. **Verify database is healthy**:
   ```bash
   docker-compose ps db
   docker-compose logs db
   ```

2. **Test database connection**:
   ```bash
   docker-compose exec db mysql -u root -proot requirements_db
   ```

3. **Check environment variables**:
   ```bash
   docker-compose exec app env | grep DB_
   ```

### Migration Failures

1. **Check migration logs**:
   ```bash
   docker-compose logs migrate
   ```

2. **Manually run migrations**:
   ```bash
   docker-compose exec app php database/migrate.php
   ```

3. **Check database state**:
   ```bash
   docker-compose exec db mysql -u root -proot requirements_db -e "SELECT * FROM schema_migrations;"
   ```

## Development Workflow

1. **Make changes** to the code in `src/`
2. **Test locally** with Docker Compose (changes are hot-reloaded via volumes)
3. **Run tests** before committing:
   ```bash
   composer run lint
   composer run test:unit
   ```
4. **Commit and push** to trigger CI/CD pipeline
5. **Monitor** the GitHub Actions pipeline for results

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass
4. Run code quality checks
5. Submit a pull request
