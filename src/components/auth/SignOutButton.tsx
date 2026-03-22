import { Icon } from "@/components/ui/Icon";
import { signOutAction } from "@/lib/auth/actions";

export function SignOutButton({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        aria-label="Sign out"
        className={
          compact
            ? "motion-press-soft flex h-11 w-11 items-center justify-center rounded-full bg-system-fill/72 text-secondary-label transition-colors duration-200 hover:bg-system-fill hover:text-label"
            : "motion-press-soft whitespace-nowrap rounded-full bg-system-fill/72 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-200 hover:bg-system-fill hover:text-label"
        }
      >
        {compact ? (
          <Icon name="logout" className="h-[18px] w-[18px]" strokeWidth={1.8} />
        ) : (
          "Leave"
        )}
      </button>
    </form>
  );
}
