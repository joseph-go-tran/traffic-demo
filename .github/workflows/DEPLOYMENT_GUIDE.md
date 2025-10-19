# GitHub Actions CI/CD Setup for Monorepo

This GitHub Actions workflow automatically detects changes in your monorepo and builds/deploys only the affected services.

## Features

- ✅ Detects changes per service directory
- ✅ Builds and deploys only changed services
- ✅ Docker image caching for faster builds
- ✅ Runs tests before deployment
- ✅ Automatic deployment to production servers
- ✅ Gateway service excluded from automation

## Services Monitored

1. **user_service** - Django-based Python service
2. **notification_service** - NestJS TypeScript service
3. **routing_service** - FastAPI Python service
4. **traffic_service** - FastAPI Python service
5. **web_service** - React + Vite frontend
6. **kafka** - Message broker

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### Docker Hub Credentials
- `DOCKER_USERNAME` - Your Docker Hub username
- `DOCKER_PASSWORD` - Your Docker Hub password or access token

### Server Deployment Credentials
- `SERVER_HOST` - Your production server IP or hostname
- `SERVER_USER` - SSH username for server access
- `SSH_PRIVATE_KEY` - Private SSH key for authentication

## How to Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret listed above

## Workflow Triggers

The workflow runs on:
- Push to `main` branch
- Push to `develop` branch
- Pull requests to `main` or `develop` branches

## How It Works

### 1. Change Detection
The workflow uses the `dorny/paths-filter` action to detect which services have changed:

```yaml
filters: |
  user_service:
    - 'user_service/**'
  notification_service:
    - 'notification_service/**'
  # ... etc
```

### 2. Conditional Job Execution
Each service has its own job that only runs if changes are detected:

```yaml
if: needs.detect-changes.outputs.user_service == 'true'
```

### 3. Build Process
For each changed service:
1. Checkout code
2. Set up language runtime (Python/Node.js)
3. Install dependencies
4. Run tests
5. Build Docker image
6. Push to Docker Hub
7. Deploy to production (only on `main` branch)

## Docker Image Tagging

Each service gets two tags:
- `latest` - Always points to the most recent build
- `<git-sha>` - Specific commit hash for rollback capability

Example:
```
youruser/user-service:latest
youruser/user-service:abc123def456
```

## Server Deployment Configuration

### Update Deployment Paths

In the workflow file, update the deployment paths for each service:

```yaml
script: |
  cd /path/to/deployment/user_service  # <- Update this
  docker-compose pull
  docker-compose up -d --force-recreate
  docker image prune -f
```

### Example Server Structure

```
/opt/services/
├── user_service/
│   └── docker-compose.yml
├── notification_service/
│   └── docker-compose.yml
├── routing_service/
│   └── docker-compose.yml
├── traffic_service/
│   └── docker-compose.yml
├── web_service/
│   └── docker-compose.yml
└── kafka/
    └── docker-compose.yml
```

### Sample docker-compose.yml for Server

```yaml
version: '3.8'
services:
  user-service:
    image: youruser/user-service:latest
    container_name: user-service
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    networks:
      - app-network

networks:
  app-network:
    external: true
```

## Customization Options

### Add Pre-deployment Checks

Add health checks before deployment:

```yaml
- name: Health check
  run: |
    response=$(curl -s -o /dev/null -w "%{http_code}" http://your-service/health)
    if [ $response -eq 200 ]; then
      echo "Service is healthy"
    else
      echo "Service is not healthy"
      exit 1
    fi
```

### Add Slack Notifications

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment completed for ${{ github.repository }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

### Add Database Migrations

For Python services with Alembic:

```yaml
- name: Run migrations
  uses: appleboy/ssh-action@v1.0.0
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: ${{ secrets.SERVER_USER }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      cd /path/to/deployment/routing_service
      docker-compose exec -T routing-service alembic upgrade head
```

## Testing the Workflow

### Test Change Detection

1. Make a change to one service:
   ```bash
   echo "# Test change" >> user_service/README.md
   git add user_service/README.md
   git commit -m "test: trigger user service build"
   git push origin develop
   ```

2. Check GitHub Actions tab to see only `build-user-service` job runs

### Local Testing

Test Docker builds locally before pushing:

```bash
# Test user service build
cd user_service
docker build -t test/user-service:local .

# Test notification service build
cd notification_service
docker build -t test/notification-service:local .
```

## Rollback Procedure

If you need to rollback to a previous version:

```bash
# SSH into your server
ssh user@your-server

# Navigate to service directory
cd /opt/services/user_service

# Update docker-compose.yml to use specific tag
# Change: image: youruser/user-service:latest
# To: image: youruser/user-service:abc123def456

# Restart the service
docker-compose up -d
```

## Monitoring Deployments

### View Workflow Runs
1. Go to your repository on GitHub
2. Click **Actions** tab
3. Click on a workflow run to see details
4. Click on individual jobs to see logs

### Check Service Status on Server

```bash
# SSH into server
ssh user@your-server

# Check running containers
docker ps

# Check service logs
docker logs -f user-service

# Check all services
docker-compose -f /opt/services/user_service/docker-compose.yml ps
```

## Troubleshooting

### Build Fails

1. Check the job logs in GitHub Actions
2. Test the build locally
3. Ensure all dependencies are in requirements.txt or package.json

### Deployment Fails

1. Check SSH credentials are correct
2. Verify server paths exist
3. Check server has enough resources (disk space, memory)
4. Verify Docker is running on the server

### Service Won't Start

1. Check service logs: `docker logs service-name`
2. Verify environment variables are set
3. Check database connections
4. Ensure required ports aren't already in use

## Performance Optimization

### Enable Build Cache

The workflow uses Docker layer caching by default:

```yaml
cache-from: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/user-service:buildcache
cache-to: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/user-service:buildcache,mode=max
```

### Parallel Builds

Multiple services build in parallel automatically if multiple services have changes.

### Skip CI for Documentation Changes

Add to commit message to skip CI:
```bash
git commit -m "docs: update README [skip ci]"
```

## Security Best Practices

1. **Use Docker Hub Access Tokens** instead of passwords
2. **Rotate SSH keys** regularly
3. **Use environment-specific secrets** for different environments
4. **Enable branch protection** on main branch
5. **Require pull request reviews** before merging
6. **Enable vulnerability scanning** on Docker images

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [SSH Action Documentation](https://github.com/appleboy/ssh-action)
- [Paths Filter Action](https://github.com/dorny/paths-filter)
