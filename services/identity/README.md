# Identity

Identity service scaffold rebuilt with NestJS and TypeORM.

## Environment

Set these environment variables before running locally:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `AUTO_RUN_MIGRATIONS`
- `AUTO_RUN_SEEDS`
- `JWT_SECRET`
- `FRONTEND_APP_URL`
- `FRONTEND_EMAIL_VERIFY_URL`
- `FRONTEND_PASSWORD_RESET_URL`

`FRONTEND_EMAIL_VERIFY_URL` and `FRONTEND_PASSWORD_RESET_URL` may be full URL
templates containing `{token}`. If omitted, the service falls back to
`FRONTEND_APP_URL`.

## Install

```bash
npm install
```

## Run

```bash
npm run start:dev
```

## Build

```bash
npm run build
```
