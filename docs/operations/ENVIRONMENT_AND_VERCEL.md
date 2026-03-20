# Environment And Vercel Operations

This document defines how environment variables are declared, synchronized, reviewed, and used in the House of Prax repository.

The goal is simple:

- one committed environment schema
- no secret values in git
- Vercel as the deployment source of values
- local files derived from Vercel when needed
- repeatable comparison between local declarations and remote configuration

---

## 1. Source Of Truth

### Environment schema

The committed schema file is:

- [`.env.example`](C:/Users/Dyrane/Documents/GitHub/hop/.env.example)

It defines:

- approved variable names
- naming conventions
- provider boundaries
- optional versus expected runtime groups

It does not contain secrets.

### Secret values

Secret values live in:

- Vercel environment variables
- local uncommitted `.env` or `.env.local` files when needed

### Repository rule

The repository stores the shape of configuration, not the secret values themselves.

---

## 2. Environment Classes

### Public variables

Prefix:

- `NEXT_PUBLIC_`

Rule:

- safe to expose to the browser
- still declared in `.env.example`

Examples:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

### Server-only variables

Rule:

- never prefixed with `NEXT_PUBLIC_`
- never read directly in client components

Examples:

- `DATABASE_URL`
- `APP_SESSION_SECRET`
- `COGNITO_USER_POOL_ID`
- `RESEND_API_KEY`

### Optional provider blocks

The schema supports both:

- AWS-native email via SES
- Resend as an alternative delivery provider

Only the chosen provider path must be fully populated at launch.

---

## 3. Naming Rules

1. Use uppercase snake case.
2. Prefix browser-exposed variables with `NEXT_PUBLIC_`.
3. Use provider prefixes where the provider matters.
4. Use descriptive names over ambiguous abbreviations.
5. Do not create duplicate aliases for the same secret.

Examples:

- good: `S3_BUCKET_NAME`
- good: `BANK_TRANSFER_ACCOUNT_NUMBER`
- bad: `BUCKET`
- bad: `SECRET_2`

---

## 4. Local File Rules

### Allowed local files

- `.env`
- `.env.local`
- `.env.preview.local`
- `.env.production.local`

### Committed files

- `.env.example` only

### Vercel cache

`vercel pull` stores environment data under `.vercel/`.

That directory is intentionally ignored and is not documentation.

---

## 5. Vercel CLI Workflow

Official references:

- [Vercel CLI overview](https://vercel.com/docs/cli)
- [Vercel env](https://vercel.com/docs/cli/env)
- [Vercel pull](https://vercel.com/docs/cli/pull)
- [Environment variables](https://vercel.com/docs/projects/environment-variables)

### Initial project linkage

```powershell
vercel link
```

Use this once per local checkout if the project is not already linked.

### List remote variables

```powershell
vercel env ls
vercel env ls production
vercel env ls preview
```

### Pull variables into a local env file

```powershell
vercel env pull .env --yes
vercel env pull .env.preview.local --environment=preview --yes
vercel env pull .env.production.local --environment=production --yes
```

### Pull Vercel project settings for `vercel dev` or `vercel build`

```powershell
vercel pull
vercel pull --environment=preview
vercel pull --environment=production
```

Use `vercel pull` when you need the `.vercel/` local cache for Vercel-managed build workflows.

Use `vercel env pull` when you need an actual env file for local application runtimes.

### Add a variable

```powershell
vercel env add DATABASE_URL development
vercel env add RESEND_API_KEY preview
```

### Update a variable

```powershell
vercel env update DATABASE_URL production
```

### Remove a variable

```powershell
vercel env rm RESEND_API_KEY preview --yes
```

### Run a command with remote env values without writing a file

```powershell
vercel env run -- npm run build
```

---

## 6. Comparison Workflow

The committed env schema must stay aligned with remote Vercel configuration.

Use:

- [scripts/ops/compare-vercel-env.ps1](C:/Users/Dyrane/Documents/GitHub/hop/scripts/ops/compare-vercel-env.ps1)

### Example

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ops\compare-vercel-env.ps1 -Environment development
powershell -ExecutionPolicy Bypass -File .\scripts\ops\compare-vercel-env.ps1 -Environment production
```

The script:

- pulls remote env variables to a temporary local file
- parses key names only
- compares them against `.env.example`
- reports missing and extra keys

### Review rule

Every environment-variable change should satisfy all three:

1. `.env.example` updated if the schema changed
2. Vercel variables updated for the relevant environment
3. comparison script run successfully

---

## 7. Launch Variable Groups

### Required for launch

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `APP_AUTH_MODE`
- `APP_SESSION_SECRET`
- `DATABASE_URL`
- `PGSSLMODE`
- `BANK_TRANSFER_BANK_NAME`
- `BANK_TRANSFER_ACCOUNT_NAME`
- `BANK_TRANSFER_ACCOUNT_NUMBER`

### Required if using Cognito

- `COGNITO_USER_POOL_ID`
- `COGNITO_USER_POOL_CLIENT_ID`
- `COGNITO_REGION`

### Required if using SES

- `SES_FROM_EMAIL`

### Required if using Resend

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

### Required if using direct S3 uploads

- `S3_BUCKET_NAME`
- `S3_BUCKET_REGION`

---

## 8. Security Rules

1. Never commit `.env`, `.env.local`, or environment-specific secret files.
2. Never paste secret values into documentation.
3. Never read server-only variables in client code.
4. Treat all database credentials as sensitive, even in preview.
5. Use `--sensitive` when adding variables in Vercel where appropriate.
6. Prefer `vercel env run` when you need remote secrets temporarily without writing them to disk.

---

## 9. Engineering Rules

1. Access env variables through a dedicated config module once implementation starts.
2. Validate required variables at app startup.
3. Fail fast on missing required configuration.
4. Do not scatter `process.env.*` access across the codebase.
5. Keep provider-specific config grouped and documented.

---

## 10. Maintenance Checklist

When adding or changing a variable:

1. Add or rename it in `.env.example`.
2. Update this document if a new variable group exists.
3. Update Vercel using `vercel env add` or `vercel env update`.
4. Pull or refresh local environment files if needed.
5. Run the comparison script.
