import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "link";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle =
    "min-h-[44px] px-6 py-2 font-mono text-xs uppercase tracking-widest font-bold transition-all duration-150 ease-out active:translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-black focus-visible:ring-offset-2 select-none cursor-pointer";
  
  let variantStyle = "";
  
  switch (variant) {
    case "primary":
      variantStyle =
        "bg-ink-black text-bg-paper border border-transparent hover:bg-bg-paper hover:text-ink-black hover:border-ink-black";
      break;
    case "secondary":
      variantStyle =
        "border border-ink-black bg-transparent text-ink-black hover:bg-ink-black hover:text-bg-paper";
      break;
    case "ghost":
      variantStyle =
        "text-ink-black hover:bg-divider-grey border border-transparent";
      break;
    case "link":
      variantStyle =
        "text-ink-black bg-transparent border border-transparent underline-offset-4 decoration-2 decoration-editorial-red hover:underline min-h-0 px-2 py-1";
      break;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${className}`}
      disabled={disabled || isLoading}
      style={{ borderRadius: "0px" }}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-3 w-3 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          PROCESSING...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
