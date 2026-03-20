# Operations Scripts

This directory contains small operational utilities that support the repository workflow.

## Available scripts

### `compare-vercel-env.ps1`

Pulls environment variables from Vercel for a target environment, compares key names against `.env.example`, and reports drift.

Example:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ops\compare-vercel-env.ps1 -Environment development
```
