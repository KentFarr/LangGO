# Deploying LangGo to an OVHcloud VPS

This guide takes an OVHcloud VPS to a running LangGo instance at `https://your-domain`, with
HTTPS and daily database backups. Everything runs in Docker Compose. There are two ways to serve
HTTPS:

- **The VPS already runs nginx for other sites** (the usual case): the app listens on
  `127.0.0.1:8082` and you add one nginx site for your domain. See
  [Existing nginx](#existing-nginx-shared-vps).
- **A dedicated VPS**: start the bundled Caddy with `--profile caddy` and it obtains Let's Encrypt
  certificates automatically (the steps below).

The services:

| Service  | Role                                                              | Public?        |
| -------- | ----------------------------------------------------------------- | -------------- |
| `caddy`  | HTTPS + reverse proxy (only with `--profile caddy`)               | ports 80, 443  |
| `app`    | Express API + built React frontend                                | 127.0.0.1:8082 |
| `db`     | PostgreSQL 18 (data in the `pgdata` volume)                       | no             |
| `backup` | Daily `pg_dump` into `./backups`                                  | no             |

## 1. Choose and prepare the VPS

- **Size:** the app and Postgres need well under 1 GB of RAM at runtime, but building the images
  on the server needs about 2 GB. Any current OVHcloud VPS plan with **2 GB+ RAM** works. On a
  smaller plan, add swap (step 2) before building.
- **OS:** Ubuntu 24.04 LTS or Debian 12/13.
- Add your SSH public key when ordering. OVH creates a sudo user (`ubuntu` or `debian`).

Log in and update:

```sh
ssh ubuntu@YOUR_VPS_IP
sudo apt update && sudo apt full-upgrade -y
```

## 2. Basic hardening

```sh
# Firewall: SSH, HTTP, HTTPS (and HTTP/3) only.
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable

# Automatic security updates.
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Optional: 2 GB of swap for small plans (helps the image build).
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

> **Docker and ufw:** ports published by Docker bypass ufw. That is why the production compose
> file publishes **only** Caddy's 80/443; the app and database are reachable only on Docker's
> internal network. Don't add `ports:` to them in production.

If you enable OVH's **Edge Network Firewall** in the control panel, allow TCP 22, 80, 443 and
UDP 443 there too. Let's Encrypt must reach port 80/443 to issue the certificate.

## 3. Install Docker

```sh
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # then log out and back in
docker compose version          # should print v2.24 or newer
```

(Membership in the `docker` group is equivalent to root on this machine; only add trusted users.)

## 4. Point your domain at the VPS

At your DNS provider, create an **A** record (and an **AAAA** record if you use the VPS's IPv6)
for your domain, e.g. `langgo.example.com → YOUR_VPS_IP`. Wait until
`dig +short langgo.example.com` returns the VPS IP before starting Caddy; otherwise certificate
issuance fails (it retries, but Let's Encrypt rate-limits repeated failures).

## 5. Get the code

For a private GitHub repo, use a read-only deploy key:

```sh
ssh-keygen -t ed25519 -f ~/.ssh/langgo_deploy -N ''
cat ~/.ssh/langgo_deploy.pub   # add in GitHub: repo → Settings → Deploy keys (read-only)
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/langgo_deploy
EOF
git clone git@github.com:KentFarr/WebApp.git langgo
cd langgo
```

## 6. Configure

```sh
cp .env.example .env                 # compose settings: domain, email, DB password
cp backend/.env.example backend/.env # app secrets
```

In **`.env`**:

- `DOMAIN`: your domain, without `https://`
- `ACME_EMAIL`: your email for Let's Encrypt notices
- `POSTGRES_PASSWORD`: `openssl rand -hex 24`

In **`backend/.env`**:

- `BETTER_AUTH_SECRET`: `openssl rand -base64 32`
- `OPENAI_API_KEY`: your key, or **leave empty to run in demo mode** with sample flashcards
- `OPENAI_MODEL`: `gpt-4o-mini` is inexpensive and works well

`DATABASE_URL`, `BETTER_AUTH_URL`, and `TRUST_PROXY_HOPS` in `backend/.env` are overridden by the
production compose file, so you can leave their development values.

Protect both files: `chmod 600 .env backend/.env`.

**OpenAI costs:** prepay a small amount of credit and set a monthly budget limit in the OpenAI
dashboard (Settings → Limits). The app also limits each user to `GENERATE_RATE_LIMIT`
generations per 15 minutes.

## 7. Start

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile caddy up -d --build
```

Tip: put the file list in `.env` so plain `docker compose` commands use production settings
(on a dedicated server, also enable the bundled Caddy):

```sh
echo 'COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml' >> .env
echo 'COMPOSE_PROFILES=caddy' >> .env   # dedicated server only; omit when nginx is already running
docker compose up -d --build
```

The commands below assume you did this.

Check that everything is healthy:

```sh
docker compose ps                 # all services "running"/"healthy"
docker compose logs -f caddy      # watch for "certificate obtained successfully"
curl -I https://your-domain       # HTTP/2 200
```

Then open `https://your-domain`, sign up, and generate some flashcards. Database migrations run
automatically when the app starts.

## Existing nginx (shared VPS)

If nginx already serves other sites on ports 80/443, don't start Caddy. Bring up the app and
database only (the default, since Caddy is behind a profile), then add an nginx site:

```sh
docker compose up -d --build            # app on 127.0.0.1:8082, db, backups
curl -fsS http://127.0.0.1:8082/healthz # {"status":"ok"}
sudo cp deploy/nginx-langgo.conf /etc/nginx/sites-available/langgo.co
sudo ln -s /etc/nginx/sites-available/langgo.co /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d langgo.co -d www.langgo.co   # adds HTTPS + redirects
```

`deploy/nginx-langgo.conf` is HTTP-only on purpose: certbot adds the HTTPS server blocks and
redirects (`TRUST_PROXY_HOPS=1`). If the domain is proxied by Cloudflare (orange cloud), use
`deploy/nginx-langgo-cloudflare.conf` with a Cloudflare Origin Certificate stored under
`/etc/ssl/cloudflare/<domain>/` (keep other zones' certificates separate), SSL/TLS mode
**Full (strict)**, and `TRUST_PROXY_HOPS=2`.

## Operating it

**Logs:** `docker compose logs -f app` (rotated automatically, 5 × 10 MB per service).

**Update to the latest code:**

```sh
git pull
docker compose up -d --build
docker image prune -f
```

New database migrations are applied when the new app container starts.

**Restart / stop:** `docker compose restart app` / `docker compose down` (data volumes are kept;
never use `down -v` unless you mean to delete the database and certificates).

## Backups

The `backup` service writes a compressed dump to `./backups` once a day (and right after it
starts), keeping `BACKUP_KEEP_DAYS` days. Check it with `ls -lh backups/` and
`docker compose logs backup`.

Backups on the same disk don't survive losing the VPS, so copy them off the server regularly, for
example from your own machine:

```sh
rsync -av ubuntu@YOUR_VPS_IP:langgo/backups/ ./langgo-backups/
```

(OVHcloud's paid automated VPS backup/snapshot option is a good complement.)

**Restore** a dump (this replaces the current data):

```sh
docker compose stop app
gunzip -c backups/langgo-YYYYMMDDTHHMMSSZ.sql.gz \
  | docker compose exec -T db psql -U langgo -d langgo -v ON_ERROR_STOP=1
docker compose start app
```

## Changing the database password later

`POSTGRES_PASSWORD` is only applied when the `pgdata` volume is first created. To change it
afterwards, update the role first, then `.env`:

```sh
docker compose exec db psql -U langgo -d langgo -c "ALTER USER langgo PASSWORD 'NEW_PASSWORD';"
# set POSTGRES_PASSWORD=NEW_PASSWORD in .env, then:
docker compose up -d
```

## Troubleshooting

| Symptom                                   | Likely cause                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `required variable DOMAIN is missing`     | `.env` not created in the repo root (step 6).                                |
| Caddy can't get a certificate             | DNS not pointing at the VPS yet, or ports 80/443 blocked (ufw/OVH firewall). |
| `password authentication failed` in logs  | `POSTGRES_PASSWORD` changed after the volume was created (see above).        |
| Generation says "temporarily unavailable" | OpenAI key invalid or out of credit; see `docker compose logs app`.          |
| Sign-in fails with "Invalid origin"       | You're not using the exact `https://DOMAIN` URL from `.env`.                 |
