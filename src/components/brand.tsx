import Link from "next/link";

/**
 * DSS mark: a decision node (diamond) over a branching base — the "support" in
 * Decision Support System. Pure SVG so it stays crisp and themeable.
 */
export function LogoMark({
  className = "h-9 w-9",
  variant = "light",
}: {
  className?: string;
  /** `light` draws for dark backgrounds, `dark` for light ones. */
  variant?: "light" | "dark";
}) {
  const stroke = variant === "light" ? "#ffffff" : "#1e3a8a";
  const accent = variant === "light" ? "#fbbf24" : "#f59e0b";

  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label="DSS logo"
      fill="none"
    >
      <rect
        width="40"
        height="40"
        rx="10"
        fill={variant === "light" ? "#ffffff" : "#1e3a8a"}
        fillOpacity={variant === "light" ? 0.12 : 1}
        stroke={stroke}
        strokeOpacity={variant === "light" ? 0.25 : 0}
      />
      <path
        d="M20 9.5 26.5 16 20 22.5 13.5 16 20 9.5Z"
        stroke={accent}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M20 22.5v4M20 26.5h-6.5M20 26.5h6.5"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity={variant === "light" ? 0.85 : 1}
      />
      <circle cx="13.5" cy="28.5" r="2" fill={stroke} fillOpacity={variant === "light" ? 0.85 : 1} />
      <circle cx="26.5" cy="28.5" r="2" fill={accent} />
    </svg>
  );
}

export function Logo({
  variant = "dark",
  href = "/",
  className = "",
}: {
  variant?: "light" | "dark";
  href?: string;
  className?: string;
}) {
  const textColor = variant === "light" ? "text-white" : "text-ink-900";
  const subColor = variant === "light" ? "text-ink-300" : "text-ink-500";

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2.5 rounded-lg ${className}`}
    >
      <LogoMark variant={variant} />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-lg font-semibold tracking-tight ${textColor}`}>
          DSS
        </span>
        <span className={`mt-0.5 text-[11px] font-medium tracking-wide ${subColor}`}>
          Decision Support System
        </span>
      </span>
    </Link>
  );
}
