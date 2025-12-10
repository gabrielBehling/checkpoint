# SSL Certificates

Place your SSL certificates in this directory:

- `cert.pem` - Your SSL certificate file (or fullchain.pem if using Let's Encrypt)
- `key.pem` - Your private key file

## For Development (Self-Signed Certificate)

To generate a self-signed certificate for development:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infra/nginx/ssl/key.pem \
  -out infra/nginx/ssl/cert.pem \
  -subj "/C=BR/ST=Sergipe/L=Aracaju/O=Checkpoint/CN=checkpoint.buzz"
```

## For Production (Let's Encrypt with Certbot)

### Step 1: Install Certbot

On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install certbot
```

### Step 2: Update docker-compose.yml

Update the nginx service volumes in `docker-compose.yml` to mount Let's Encrypt certificates:

```yaml
nginx:
  volumes:
    # Let's Encrypt certificates (production)
    - /etc/letsencrypt/live/checkpoint.buzz/fullchain.pem:/etc/nginx/ssl/cert.pem:ro
    - /etc/letsencrypt/live/checkpoint.buzz/privkey.pem:/etc/nginx/ssl/key.pem:ro
    # ACME challenge directory
    - /var/www/certbot:/var/www/certbot:ro
```

### Step 3: Initial Certificate Generation

**Option A: Standalone Mode (Recommended for first-time setup)**

1. **Stop nginx temporarily** (certbot needs port 80):
   ```bash
   docker-compose stop nginx
   ```

2. **Run certbot to obtain certificates**:
   ```bash
   sudo certbot certonly --standalone -d checkpoint.buzz
   ```
   
   Or if you have multiple domains:
   ```bash
   sudo certbot certonly --standalone -d checkpoint.buzz -d www.checkpoint.buzz
   ```

3. **Start nginx again**:
   ```bash
   docker-compose up -d nginx
   ```


### Step 4: Verify Certificates

Check that certificates were created:
```bash
sudo ls -la /etc/letsencrypt/live/checkpoint.buzz/
```

You should see:
- `fullchain.pem` (certificate + chain)
- `privkey.pem` (private key)
- `cert.pem` (certificate only)
- `chain.pem` (chain only)

### Step 5: Certificate Renewal

Let's Encrypt certificates expire every 90 days. Set up automatic renewal:

1. **Test renewal**:
   ```bash
   sudo certbot renew --dry-run
   ```

2. **Add to crontab** (runs twice daily):
   ```bash
   sudo crontab -e
   ```
   
   Add this line:
   ```
   0 0,12 * * * certbot renew --quiet && docker-compose -f /path/to/your/docker-compose.yml restart nginx
   ```
   
   Replace `/path/to/your/docker-compose.yml` with the actual path to your docker-compose.yml file.

### Alternative: Copy Certificates to Local Directory

If you prefer to copy certificates instead of mounting:

```bash
sudo cp /etc/letsencrypt/live/checkpoint.buzz/fullchain.pem ./infra/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/checkpoint.buzz/privkey.pem ./infra/nginx/ssl/key.pem
sudo chmod 644 ./infra/nginx/ssl/cert.pem
sudo chmod 600 ./infra/nginx/ssl/key.pem
```

Then use the local volume mount in `docker-compose.yml`:
```yaml
volumes:
  - ./infra/nginx/ssl:/etc/nginx/ssl:ro
```

**Note:** If using the copy method, you'll need to manually copy certificates after each renewal.