# Render Deployment

## Service type

Deploy the backend as a Render `Web Service`, not a static site.

## Recommended flow

1. Push this repo to GitHub.
2. In Render, choose `New +` -> `Blueprint`.
3. Select this repo so Render reads the repo-root `render.yaml`.
4. Fill in the required secret env vars when prompted.
5. Deploy and wait for the health check at `/health` to pass.

## Required environment variables

Set these before the first successful deploy:

- `MONGODB_URI`
- `CORS_ORIGIN`
- `FRONTEND_URL`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`

## Feature-specific environment variables

Set these if you use the corresponding features:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET_NAME`
- `AWS_REGION`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

## After backend deploy

1. Copy the Render backend URL.
2. In Vercel, set `VITE_API_URL` to that URL.
3. Redeploy the frontend.
4. Set `CORS_ORIGIN` and `FRONTEND_URL` on Render to your Vercel frontend URL.

## Smoke tests

- `GET /health` should return `200`
- `GET /api/v1/auth/current-user` should return `401` without a token
- Socket features should connect only after `CORS_ORIGIN` is correct
