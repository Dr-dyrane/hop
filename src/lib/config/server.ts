import "server-only";

import {
  readEmailEnv,
  readEmailListEnv,
  readEnumEnv,
  readOptionalEnv,
} from "@/lib/config/env-core";
import { publicEnv } from "@/lib/config/public";

export type AppAuthMode = "email_otp";
export type PgSslMode = "disable" | "allow" | "prefer" | "require";

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

export const serverEnv = {
  nodeEnv,
  isProduction,
  isDevelopment: nodeEnv !== "production",
  public: publicEnv,
  auth: {
    mode: readEnumEnv("APP_AUTH_MODE", process.env.APP_AUTH_MODE, ["email_otp"], "email_otp"),
    sessionSecret:
      readOptionalEnv(process.env.APP_SESSION_SECRET) ??
      "hop-development-session-secret-change-me",
    developmentOtpCode: process.env.AUTH_DEV_OTP_CODE?.trim() || "111111",
    adminEmails: readEmailListEnv("ADMIN_EMAILS", process.env.ADMIN_EMAILS, [
      "halodyrane@gmail.com",
    ]),
  },
  aws: {
    region: readOptionalEnv(process.env.AWS_REGION),
    accountId: readOptionalEnv(process.env.AWS_ACCOUNT_ID),
    roleArn: readOptionalEnv(process.env.AWS_ROLE_ARN),
    resourceArn: readOptionalEnv(process.env.AWS_RESOURCE_ARN),
  },
  database: {
    url: readOptionalEnv(process.env.DATABASE_URL),
    directUrl: readOptionalEnv(process.env.DATABASE_DIRECT_URL),
    host: readOptionalEnv(process.env.PGHOST),
    port: process.env.PGPORT?.trim() || "5432",
    name: readOptionalEnv(process.env.PGDATABASE),
    user: readOptionalEnv(process.env.PGUSER),
    password: readOptionalEnv(process.env.PGPASSWORD),
    sslMode: readEnumEnv(
      "PGSSLMODE",
      process.env.PGSSLMODE,
      ["disable", "allow", "prefer", "require"],
      "require"
    ) as PgSslMode,
  },
  storage: {
    bucketName: readOptionalEnv(process.env.S3_BUCKET_NAME),
    bucketRegion: readOptionalEnv(process.env.S3_BUCKET_REGION),
    uploadPrefix: process.env.S3_UPLOAD_PREFIX?.trim() || "uploads",
  },
  email: {
    resendApiKey: readOptionalEnv(process.env.RESEND_API_KEY),
    resendFromEmail:
      readEmailEnv("RESEND_FROM_EMAIL", process.env.RESEND_FROM_EMAIL) ??
      (isProduction ? undefined : "onboarding@resend.dev"),
    sesFromEmail: readEmailEnv("SES_FROM_EMAIL", process.env.SES_FROM_EMAIL),
    sesConfigurationSet: readOptionalEnv(process.env.SES_CONFIGURATION_SET),
  },
  operations: {
    bankName: readOptionalEnv(process.env.BANK_TRANSFER_BANK_NAME),
    accountName: readOptionalEnv(process.env.BANK_TRANSFER_ACCOUNT_NAME),
    accountNumber: readOptionalEnv(process.env.BANK_TRANSFER_ACCOUNT_NUMBER),
  },
  cron: {
    secret: readOptionalEnv(process.env.CRON_SECRET),
  },
  vercel: {
    accessToken: readOptionalEnv(process.env.VERCEL_ACCESS_TOKEN),
  },
} as const;

if (serverEnv.isProduction && serverEnv.auth.sessionSecret === "hop-development-session-secret-change-me") {
  throw new Error("APP_SESSION_SECRET must be set before running in production.");
}

export const hasDatabaseConfig = Boolean(
  serverEnv.database.url ||
    (serverEnv.database.host &&
      serverEnv.database.name &&
      serverEnv.database.user &&
      (serverEnv.database.password || (serverEnv.aws.region && serverEnv.aws.roleArn)))
);

export const hasStorageConfig = Boolean(
  serverEnv.storage.bucketName && serverEnv.storage.bucketRegion
);

export const hasEmailDeliveryConfig = Boolean(
  (serverEnv.email.resendApiKey && serverEnv.email.resendFromEmail) ||
    serverEnv.email.sesFromEmail
);
