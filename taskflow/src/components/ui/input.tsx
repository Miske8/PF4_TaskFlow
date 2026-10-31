import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

/**
 * TaskFlow — Input avec label et message d'erreur accessibles (aria-invalid).
 */
type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, label, error, id, type = "text", ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            "h-10 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500",
            "dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500",
            error
              ? "border-red-500 dark:border-red-500"
              : "border-zinc-300 dark:border-zinc-700",
            className,
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  },
);
InputField.displayName = "InputField";
