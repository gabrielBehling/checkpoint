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

## For Production (Let's Encrypt)

If using Let's Encrypt with certbot, you can mount the certificates:

```yaml
volumes:
  - /etc/letsencrypt/live/checkpoint.buzz/fullchain.pem:/etc/nginx/ssl/cert.pem:ro
  - /etc/letsencrypt/live/checkpoint.buzz/privkey.pem:/etc/nginx/ssl/key.pem:ro
```

Or copy them to this directory.