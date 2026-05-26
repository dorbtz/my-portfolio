import { forwardRef } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/**
 * Themable admin form primitives.
 *
 * Why this exists: every input on `/admin/projects` previously hard-coded
 * Tailwind classes tuned for the Thor (dark) palette — `border-white/10`,
 * `bg-white/2`, `bg-[#0f1320]`, `text-cyan-...`. Those colours are invisible
 * against the Luffy (cream) manga background.
 *
 * These wrappers emit a single semantic class per element type so theming
 * can route through `.admin-shell--thor` / `.admin-shell--manga` overrides
 * defined in `src/index.css`. All other native props (id, name, value,
 * onChange, type, placeholder, required, etc.) are forwarded.
 */

// ---------------------------------------------------------------------------
// Field wrapper — renders a label, optional hint, optional inline error.
// ---------------------------------------------------------------------------
type AdminFieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
  /**
   * If true, the wrapper renders as a `<div>` instead of `<label>`. Use this
   * for compound controls (e.g. checkbox + secondary text) that already
   * contain their own `<label>` semantics.
   */
  asDiv?: boolean;
};

export function AdminField({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
  asDiv,
}: AdminFieldProps) {
  const Tag = (asDiv ? "div" : "label") as "label" | "div";
  const props = asDiv ? {} : { htmlFor };
  return (
    <Tag className={["admin-field block", className].filter(Boolean).join(" ")} {...props}>
      <span className="admin-field__label text-sm">{label}</span>
      {children}
      {hint && <span className="admin-field__hint mt-1 block text-xs opacity-60">{hint}</span>}
      {error && (
        <span className="admin-field__error mt-1 block text-xs text-rose-400" role="alert">
          {error}
        </span>
      )}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Form primitives — thin forwardRef wrappers that set the themed className.
// ---------------------------------------------------------------------------
export const AdminInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function AdminInput({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={["admin-field__input mt-1 w-full", className].filter(Boolean).join(" ")}
        {...rest}
      />
    );
  },
);

export const AdminSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function AdminSelect({ className, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={["admin-field__select mt-1 w-full", className].filter(Boolean).join(" ")}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

export const AdminTextarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function AdminTextarea({ className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={["admin-field__textarea mt-1 w-full", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
});

export const AdminCheckbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function AdminCheckbox({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={["admin-field__checkbox", className].filter(Boolean).join(" ")}
        {...rest}
      />
    );
  },
);
