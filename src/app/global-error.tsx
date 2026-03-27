"use client";

import { useEffect } from "react";
import { AppErrorState } from "@/components/system/AppErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <AppErrorState
          title="The app shell crashed."
          detail="A root-level failure interrupted the workspace. Reload the shell first. If the problem persists, return to the home route."
          primaryActionLabel="Reload shell"
          onPrimaryAction={reset}
          secondaryActionLabel="Home"
          onSecondaryAction={() => window.location.assign("/")}
          debugMessage={process.env.NODE_ENV === "development" ? error.message : null}
        />
      </body>
    </html>
  );
}
