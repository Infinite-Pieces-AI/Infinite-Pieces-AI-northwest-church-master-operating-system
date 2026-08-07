import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./utils";

export function Badge({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span className={cx("church-badge", className)} {...props}>
      {children}
    </span>
  );
}
