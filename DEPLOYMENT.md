# Production Deployment Guide

## Server Information
- **Production Server IP**: 74.208.77.43
- **API Endpoint**: http://74.208.77.43:8765
- **Law4Hire Web**: http://74.208.77.43:5173
- **Cannlaw Web**: http://74.208.77.43:5174

## Prerequisites

1. **Docker and Docker Compose** installed on the production server
2. **Git** installed on the production server
3. **Firewall configuration** to allow ports: 1433 (SQL), 5173 (Law4Hire), 5174 (Cannlaw), 8765 (API)

## Initial Setup

### 1. Clone the Repository

```bash
ssh user@74.208.77.43
cd /opt
git clone https://github.com/Law4Hire/L4H.git
cd L4H
```

### 2. Configure Environment Variables

```bash
# Copy the environment template
cp .env.production.template .env.production

# Edit the file with secure values
nano .env.production
```

**IMPORTANT**: Set strong, unique passwords for:
- `SQL_SA_PASSWORD`: SQL Server SA password (minimum 8 characters, must include uppercase, lowercase, numbers, and symbols)
- `JWT_SIGNING_KEY`: JWT signing key (minimum 32 characters)
- `UPLOAD_TOKEN_SIGNING_KEY`: Upload token signing key (minimum 16 characters)
- `ADMIN_SEED_PASSWORD`: Admin user password (minimum 8 characters)

Example secure values:
```bash
SQL_SA_PASSWORD=Sql$3rv3r!P@ssw0rd2024_SecureDB
JWT_SIGNING_KEY=MyVerySecureJWTSigningKey_32PlusCharacters_ProductionOnly_2024!
UPLOAD_TOKEN_SIGNING_KEY=Upload$3cur3T0k3n!2024
ADMIN_SEED_PASSWORD=Adm1n!S3cur3P@ss2024
```

### 3. Create Required Directories

```bash
mkdir -p data/uploads/quarantine
mkdir -p data/uploads/clean
mkdir -p logs/api
mkdir -p backups
```

### 4. Set Proper Permissions

```bash
chmod 700 .env.production
chmod -R 755 data
chmod -R 755 logs
chmod -R 755 backups
```

## Deployment

### Initial Deployment

```bash
# Load environment variables
export $(cat .env.production | xargs)

# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build
```

### Verify Deployment

```bash
# Check all containers are running
docker ps

# Expected output should show 4 containers:
# - l4h-sqlserver-prod
# - l4h-api-prod
# - l4h-web-prod
# - cannlaw-web-prod

# Check API health
curl http://74.208.77.43:8765/healthz

# Check Law4Hire health
curl http://74.208.77.43:5173/healthz

# Check Cannlaw health
curl http://74.208.77.43:5174/healthz

# View API logs
docker logs l4h-api-prod

# View SQL Server logs
docker logs l4h-sqlserver-prod
```

### Database Migrations

The API automatically runs migrations on startup. To verify:

```bash
docker logs l4h-api-prod | grep -i migration
```

## Updates and Maintenance

### Updating the Application

```bash
# Pull latest code
git pull origin master

# Reload environment variables
export $(cat .env.production | xargs)

# Rebuild and restart services
docker-compose -f docker-compose.prod.yml up -d --build

# Remove old images
docker image prune -f
```

### Viewing Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs

# Follow API logs in real-time
docker logs -f l4h-api-prod

# View last 100 lines of Law4Hire logs
docker logs --tail 100 l4h-web-prod

# View SQL Server logs
docker logs l4h-sqlserver-prod
```

### Database Backup

```bash
# Manual backup
docker exec l4h-sqlserver-prod /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "${SQL_SA_PASSWORD}" \
  -Q "BACKUP DATABASE L4H TO DISK = '/var/opt/mssql/backups/L4H_$(date +%Y%m%d_%H%M%S).bak'"

# Automated daily backup (add to cron)
0 2 * * * cd /opt/L4H && docker exec l4h-sqlserver-prod /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$(grep SQL_SA_PASSWORD .env.production | cut -d '=' -f2)" -Q "BACKUP DATABASE L4H TO DISK = '/var/opt/mssql/backups/L4H_$(date +\%Y\%m\%d_\%H\%M\%S).bak'"
```

### Database Restore

```bash
# List available backups
ls -lh backups/

# Restore from backup
docker exec l4h-sqlserver-prod /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "${SQL_SA_PASSWORD}" \
  -Q "RESTORE DATABASE L4H FROM DISK = '/var/opt/mssql/backups/L4H_20240101_020000.bak' WITH REPLACE"
```

## Monitoring

### Health Checks

All services have built-in health checks:

```bash
# Check health status
docker-compose -f docker-compose.prod.yml ps

# Manual health checks
curl http://74.208.77.43:8765/healthz
curl http://74.208.77.43:5173/healthz
curl http://74.208.77.43:5174/healthz
```

### Resource Usage

```bash
# View container resource usage
docker stats

# View disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs for specific service
docker logs l4h-api-prod

# Check if ports are already in use
netstat -tulpn | grep -E '8765|5173|5174|1433'

# Restart specific service
docker-compose -f docker-compose.prod.yml restart api
```

### Database Connection Issues

```bash
# Test SQL Server connection
docker exec l4h-sqlserver-prod /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "${SQL_SA_PASSWORD}" \
  -Q "SELECT @@VERSION"

# Check SQL Server logs
docker logs l4h-sqlserver-prod | grep -i error
```

### API Returns 502/503

```bash
# Check if API container is running
docker ps | grep l4h-api-prod

# Check API logs
docker logs --tail 50 l4h-api-prod

# Restart API service
docker-compose -f docker-compose.prod.yml restart api
```

### Frontend Shows "API Connection Error"

```bash
# Verify nginx configuration
docker exec l4h-web-prod cat /etc/nginx/conf.d/default.conf

# Check nginx logs
docker exec l4h-web-prod cat /var/log/nginx/error.log

# Test API connectivity from web container
docker exec l4h-web-prod wget -O- http://api:8080/healthz
```

## Security Considerations

1. **Firewall Configuration**: Only expose necessary ports (5173, 5174, 8765)
2. **SSL/TLS**: Consider setting up a reverse proxy (nginx/Apache) with Let's Encrypt SSL
3. **Environment Variables**: Never commit `.env.production` to version control
4. **Database Access**: SQL Server port 1433 should NOT be exposed externally
5. **Regular Updates**: Keep Docker images and host OS updated
6. **Backup Strategy**: Implement automated backups with off-server storage

## SSL/TLS Setup (Recommended)

For production, you should set up SSL certificates. Here's a basic nginx reverse proxy setup:

```bash
# Install nginx on host (not in container)
sudo apt-get install nginx certbot python3-certbot-nginx

# Get SSL certificates (requires domain names)
sudo certbot --nginx -d law4hire.com -d www.law4hire.com
sudo certbot --nginx -d cannlaw.com -d www.cannlaw.com

# Configure nginx to proxy to Docker containers
# Create /etc/nginx/sites-available/law4hire.conf
# Create /etc/nginx/sites-available/cannlaw.conf
```

## Performance Tuning

### Production Optimizations

1. **Database Indexing**: Ensure proper indexes are in place
2. **Connection Pooling**: Configured in appsettings.Production.json
3. **Static Asset Caching**: Nginx configured with 1-year cache for static files
4. **Gzip Compression**: Enabled in nginx configuration
5. **Log Level**: Set to Warning in production to reduce I/O

### Scaling Considerations

- Use external SQL Server (Azure SQL, AWS RDS) for better performance
- Implement Redis for session management
- Use CDN for static assets
- Consider load balancer for multiple API instances

## Support

For issues or questions:
- Check logs first: `docker-compose -f docker-compose.prod.yml logs`
- Review this documentation
- Contact technical lead

## Quick Reference

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Update and rebuild
git pull && docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Backup database
docker exec l4h-sqlserver-prod /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "${SQL_SA_PASSWORD}" -Q "BACKUP DATABASE L4H TO DISK = '/var/opt/mssql/backups/L4H_$(date +%Y%m%d_%H%M%S).bak'"
```

---

**Last Updated**: 2025-01-10
**Version**: 1.0
**Maintainer**: Law4Hire Development Team
