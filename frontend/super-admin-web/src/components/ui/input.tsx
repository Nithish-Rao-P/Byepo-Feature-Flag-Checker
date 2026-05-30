import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="font-mono text-xs uppercase tracking-widest text-ink-black font-bold select-none"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`border-b-2 border-ink-black bg-transparent px-3 py-2 font-mono text-sm focus-visible:bg-[#F0F0F0] focus-visible:outline-none transition-colors duration-150 placeholder:text-neutral-400 ${
            error ? "border-editorial-red text-editorial-red" : ""
          } ${className}`}
          style={{ borderRadius: "0px" }}
          {...props}
        />
        {error && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-editorial-red mt-0.5">
            ⚠ {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
