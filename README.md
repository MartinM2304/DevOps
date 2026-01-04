# Requirements Management System

System for tracking functional and non-functional project requirements.

### Local dev

```
docker-compose up -d
```

### CI/CD Pipeline

The pipeline is automated via GitHub Actions and handles:
- Linting: PHPCS (PSR-12 standard).
- SAST: Static analysis via SonarQube.
- Build: Automated Docker image tagging and push to registry.
- CD: Deployment to k3d/Kubernetes.

### Kubernetes Deployment

```bash
kubectl apply -f k8s/
```

## Project structure

- `src/` - Application source (Frontend/Backend).
- `database/` - SQL schema and migrations.
- `docker/` - Dockerfiles and environment configs.
- `k8s/` - Kubernetes Deployment, Service, and Ingress manifests.
- `tests/` - Unit tests and test fixtures.
- `.github/workflows/` - CI/CD pipeline definitions. 