import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  sage: "bg-sage text-sage-fg hover:opacity-90",
  line: "border border-line bg-surface text-ink hover:bg-ink-soft",
  ghost: "bg-transparent text-ink hover:bg-ink-soft",
  quiet: "bg-transparent text-muted hover:text-ink",
} as const;

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }
>(function Button({ variant = "primary", className, type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});

export function Toggle({
  pressed,
  label,
  onClick,
}: {
  pressed: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-control border px-4 text-sm font-medium",
        pressed ? "border-accent bg-clay-soft text-ink" : "border-line bg-surface text-muted",
      )}
    >
      {label}
    </button>
  );
}
