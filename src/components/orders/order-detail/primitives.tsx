import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { PANEL_MOTION } from "./constants";
import styles from "./order-detail.module.css";

export type FocusPanelVariant = "primary" | "secondary" | "muted" | "overlay";

export function AnimatedReveal({
  show,
  panelKey,
  children,
}: {
  show: boolean;
  panelKey: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          key={panelKey}
          initial={PANEL_MOTION.initial}
          animate={PANEL_MOTION.animate}
          exit={PANEL_MOTION.exit}
          transition={PANEL_MOTION.transition}
          className={styles.animatedSection}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function TaskIntro({
  title,
  description,
  status,
  icon,
}: {
  title: string;
  description?: string;
  status?: string;
  icon?: IconName;
}) {
  return (
    <div className={styles.taskIntro}>
      <div>
        <div className={styles.taskTitle}>{title}</div>
        {description ? <div className={styles.taskDescription}>{description}</div> : null}
      </div>
      {status ? (
        <div className={styles.inlineStatus}>
          {icon ? <Icon name={icon} size={14} strokeWidth={1.8} /> : null}
          <span>{status}</span>
        </div>
      ) : null}
    </div>
  );
}

export function FocusPanel({
  title,
  action,
  children,
  variant = "secondary",
  dimmed = false,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  variant?: FocusPanelVariant;
  dimmed?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        styles.panel,
        styles[`panel${capitalize(variant)}`],
        dimmed && styles.dimmed,
        className
      )}
    >
      <div className={styles.panelHeader}>
        <p className={styles.panelTitle}>{title}</p>
        {action}
      </div>
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
}

export function TopMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className={styles.topMetric}>
      <div className={styles.topMetricLabel}>{label}</div>
      <div className={styles.topMetricValue}>{value}</div>
      {detail ? <div className={styles.topMetricDetail}>{detail}</div> : null}
    </div>
  );
}

export function QuietStat({
  label,
  value,
  detail,
  subdued = false,
  className,
}: {
  label: string;
  value: string;
  detail?: string;
  subdued?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(styles.quietStat, subdued && styles.dimmed, className)}>
      <div className={styles.quietStatLabel}>{label}</div>
      <div className={styles.quietStatValue}>{value}</div>
      {detail ? <div className={styles.quietStatDetail}>{detail}</div> : null}
    </div>
  );
}

export function MetaCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.metaCard}>
      <div className={styles.metaLabel}>{label}</div>
      <div className={styles.metaValue}>{value}</div>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
