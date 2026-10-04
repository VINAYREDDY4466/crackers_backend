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

Product, category, and banner uploads go to AWS S3. They are not stored in an `uploads` folder. Set `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`. The bucket policy must allow public `s3:GetObject` on `products/*`, `categories/*`, and `banners/*`.

Catalog seed images are remote URLs, so the shop can run before S3 is configured. Uploading a replacement image requires S3.

## Orders

`POST /api/orders` recalculates prices on the server, saves the order, records a WhatsApp redirect event, and returns a `wa.me` link. A redirect is not a completed order. Admin updates the real status after speaking with the customer.
