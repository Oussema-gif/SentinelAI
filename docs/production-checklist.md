# SentinelAI Production Release Checklist

## Before deployment

- [ ] Domain and TLS
  - [ ] Domain registered and DNS configured.
  - [ ] TLS certificate obtained (e.g., Let’s Encrypt) and renewal automated.
- [ ] Secrets management
  - [ ] `POSTGRES_PASSWORD` generated and stored securely.
  - [ ] `DATABASE_URL` configured with strong credentials.
  - [ ] `MESSAGE_FINGERPRINT_SECRET` generated (32+ bytes, hex or base64).
  - [ ] No secrets in source control; use environment or secret manager.
- [ ] Database
  - [ ] PostgreSQL configured with persistent storage.
  - [ ] Automated backups enabled (daily or more frequent).
  - [ ] Restore procedure tested.
  - [ ] Retention policy defined (e.g., 30 days).
- [ ] Application
  - [ ] `APP_ENV=production`.
  - [ ] `CORS_ALLOWED_ORIGINS` set to production domain(s) only.
  - [ ] Health endpoints verified (`/health/live`, `/health/ready`).
- [ ] Nginx / edge
  - [ ] Security headers configured (CSP, X-Frame-Options, etc.).
  - [ ] Rate limiting enabled for `/api/*`.
  - [ ] TLS configured with strong ciphers and HSTS (if applicable).
- [ ] Monitoring
  - [ ] Container health checks enabled.
  - [ ] Uptime monitoring configured.
  - [ ] Alerting on failed health checks or high error rates.

## Deployment

- [ ] Production Compose applied:
  ```bash
  podman-compose \
    -f compose.yaml \
    -f compose.production.yaml \
    up -d
  ```
- [ ] All services healthy:
  ```bash
  podman-compose ps
  ```
- [ ] External checks:
  - [ ] `https://sentinelai.example.com/` returns 200.
  - [ ] `https://sentinelai.example.com/api/health/ready` returns `{"status":"ok"}`.
  - [ ] Security headers present.

## Post-deployment

- [ ] Run smoke tests (login, send message, view analytics).
- [ ] Verify logs are accessible and rotating.
- [ ] Confirm backup job runs successfully.
- [ ] Document runbook for:
  - Backup/restore.
  - Rolling restarts.
  - Secret rotation.
  - Incident response.

## Ongoing operations

- [ ] Review logs and metrics weekly.
- [ ] Test restore from backup at least quarterly.
- [ ] Rotate secrets per policy.
- [ ] Apply security updates to base images regularly.
