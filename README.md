# Deepam Crackers API

Customer shop API for browsing crackers and placing a WhatsApp order, plus a JWT-protected admin API.

## Run

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

The API listens on port `5050`.

Seeded admin (change this before any real deployment):

- Email: `admin@deepamcrackers.test`
- Password: `ChangeMe@123`

Set `WHATSAPP_NUMBER` with country code, digits only, for example `919876543210`.

## Images

Product, category, and banner uploads go to AWS S3. They are not stored in an `uploads` folder. Set `AWS_REGION` and `AWS_S3_BUCKET`. Locally, also set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`; on EC2, leave them out and attach an IAM role instead. The bucket policy must allow public `s3:GetObject` on `products/*`, `categories/*`, and `banners/*`.

Catalog seed images are remote URLs, so the shop can run before S3 is configured. Uploading a replacement image requires S3.

## Orders

`POST /api/orders` recalculates prices on the server, saves the order, records a WhatsApp redirect event, and returns a `wa.me` link. A redirect is not a completed order. Admin updates the real status after speaking with the customer.

## Deployment (GitHub Actions to EC2)

Every push to `main` runs `.github/workflows/deploy.yml`:

1. **Check:** `npm ci`, `npm run check` (syntax), and `npm audit` on production dependencies. Pull requests stop here.
2. **Deploy:** connects to EC2 over SSH. The server only allows that key to run `deploy/release.sh`, which does `git fetch` and `git reset` to the pushed commit, `npm ci`, `pm2 startOrReload`, and fails the run if `/api/health` does not respond.

Repository secrets (Settings > Secrets and variables > Actions): `EC2_HOST` (Elastic IP) and `EC2_SSH_KEY` (private key of the CI key pair). Optional variable: `API_HEALTH_URL`.

Server files:

- The repo is cloned at `/home/ubuntu/crackers_backend` using a read-only GitHub deploy key.
- `deploy/ec2-user-data.sh`: first-boot setup (Node 22, PM2, Git, Nginx, Certbot).
- `deploy/enable-https.sh`: Nginx and Let's Encrypt for the API domain.
- The production `.env` lives only on the server at `/home/ubuntu/crackers_backend/.env`.

To roll back, open an older successful run in GitHub Actions and choose **Re-run all jobs**.
