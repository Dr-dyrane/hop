"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  getShellMatchedRoute,
  type ShellFabAction,
  type ShellHeaderRoute,
} from "@/lib/app-shell";
import { useFeedback } from "@/components/providers/FeedbackProvider";

function triggerHeaderAction(action: ShellFabAction, router: ReturnType<typeof useRouter>) {
  if (action.kind === "cart") {
    window.dispatchEvent(new Event("commerce:open-cart"));
    return;
  }

  if (action.kind === "submit") {
    const form = action.formId ? document.getElementById(action.formId) : null;
    if (form instanceof HTMLFormElement) {
      form.requestSubmit();
    }
    return;
  }

  if (action.kind === "event" && action.eventName) {
    window.dispatchEvent(new CustomEvent(action.eventName));
    return;
  }

  if (action.href) {
    router.push(action.href);
  }
}

export function WorkspaceHeaderAction({
  routes,
}: {
  routes: ShellHeaderRoute[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const feedback = useFeedback();
  const action = getShellMatchedRoute(pathname, routes)?.headerAction ?? null;

  if (!action) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        feedback.selection();
        triggerHeaderAction(action, router);
      }}
      className="hidden min-h-[38px] items-center rounded-full bg-system-fill/64 px-4 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-200 hover:bg-system-fill md:inline-flex"
    >
      {action.label}
    </button>
  );
}
