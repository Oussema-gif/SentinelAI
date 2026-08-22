import type { FC } from "react";

interface LogoIconProps {
  className?: string;
  size?: number;
}

export const LogoIcon: FC<LogoIconProps> = ({
  className,
  size = 32,
}) => {
  return (
    <svg
      aria-label="SentinelAI logo"
      className={className}
      fill="none"
      height={size}
      role="img"
      viewBox="0 0 64 64"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 4 8 14v16c0 14.5 9.7 25.2 24 30 14.3-4.8 24-15.5 24-30V14L32 4Z"
        fill="currentColor"
      />
      <path
        d="M32 16v17l15-9"
        stroke="#0A1220"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      <path
        d="M17 34a16 16 0 0 1 30 0M21 42a12 12 0 0 1 22 0"
        stroke="#0A1220"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <circle cx="32" cy="33" fill="#0A1220" r="4" />
    </svg>
  );
};
