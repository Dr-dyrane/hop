import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/config/server";
import { runOrderAutomationPass } from "@/lib/db/repositories/order-automation-repository";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  if (serverEnv.isDevelopment && !serverEnv.cron.secret) {
    return true;
  }

  const expected = serverEnv.cron.secret;

  if (!expected) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Cron access denied.",
      },
      { status: 401 }
    );
  }

  const result = await runOrderAutomationPass();

  return NextResponse.json(
    {
      ok: true,
      data: result,
    },
    { status: 200 }
  );
}
