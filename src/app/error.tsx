"use client";

import { useEffect } from "react";
import { AppErrorState } from "@/components/system/AppErrorState";

export default function RootError({
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
    <AppErrorState
      title="This view lost sync."
      detail="The workspace hit an unexpected error. Reset the view first. If it happens again, reload the app shell."
      primaryActionLabel="Try again"
      onPrimaryAction={reset}
      secondaryActionLabel="Go home"
      onSecondaryAction={() => window.location.assign("/")}
      debugMessage={process.env.NODE_ENV === "development" ? error.message : null}
    />
  );
}
