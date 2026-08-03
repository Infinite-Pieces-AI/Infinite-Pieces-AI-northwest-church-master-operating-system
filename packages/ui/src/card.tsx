import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./utils";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  as?: "article" | "section" | "div";
  interactive?: boolean;
}

export function Card({ children, className, as: Component = "article", interactive = false, ...props }: CardProps) {
  return (
    <Component className={cx("church-card", interactive && "church-card--interactive", className)} {...props}>
      {children}
    </Component>
  );
}
