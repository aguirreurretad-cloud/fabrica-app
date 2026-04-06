import { type CSSProperties } from "react";

// ─── Badge ───────────────────────────────────────────────────────────────────
type BadgeVariant = "success" | "warning" | "danger" | "info" | "gray" | "teal";

const BADGE_STYLES: Record<BadgeVariant, CSSProperties> = {
  success: { background: "#EAF3DE", color: "#3B6D11" },
  warning: { background: "#FAEEDA", color: "#854F0B" },
  danger:  { background: "#FCEBEB", color: "#A32D2D" },
  info:    { background: "#E6F1FB", color: "#185FA5" },
  gray:    { background: "#F1EFE8", color: "#5F5E5A" },
  teal:    { background: "#E1F5EE", color: "#0F6E56" },
};

export function Badge({ children, variant = "gray" }: { children: React.ReactNode; variant?: BadgeVariant }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 9px", borderRadius: "20px",
      fontSize: "11px", fontWeight: 500,
      ...BADGE_STYLES[variant],
    }}>
      {children}
    </span>
  );
}

// ─── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const BTN_BASE: CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  gap: "6px", borderRadius: "var(--radius)",
  fontFamily: "var(--font-main)", fontWeight: 500, cursor: "pointer",
  transition: "all 0.12s", border: "1px solid transparent",
};

const BTN_VARIANTS: Record<string, CSSProperties> = {
  primary:   { background: "var(--brand)",    color: "#fff",             borderColor: "var(--brand)" },
  secondary: { background: "var(--surface)",  color: "var(--text)",      borderColor: "var(--border)" },
  danger:    { background: "var(--danger-bg)", color: "var(--danger)",   borderColor: "#fecaca" },
  ghost:     { background: "transparent",      color: "var(--text-2)",   borderColor: "transparent" },
};

const BTN_SIZES: Record<string, CSSProperties> = {
  sm: { fontSize: "12px", padding: "6px 12px" },
  md: { fontSize: "13px", padding: "8px 16px" },
  lg: { fontSize: "14px", padding: "10px 20px" },
};

export function Button({
  children, variant = "secondary", size = "md",
  loading, disabled, style, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      style={{
        ...BTN_BASE,
        ...BTN_VARIANTS[variant],
        ...BTN_SIZES[size],
        opacity: loading || disabled ? 0.6 : 1,
        cursor: loading || disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {loading && <span style={{ fontSize: "12px" }}>⟳</span>}
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children, style, padding = "20px",
}: {
  children: React.ReactNode;
  style?: CSSProperties;
  padding?: string;
}) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      padding,
      boxShadow: "var(--shadow-sm)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── CardHeader ──────────────────────────────────────────────────────────────
export function CardHeader({
  title, action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: "16px",
    }}>
      <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({
  icon = "◻", title, description, action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      padding: "48px 24px", textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
    }}>
      <div style={{ fontSize: "32px", marginBottom: "4px" }}>{icon}</div>
      <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{title}</div>
      {description && (
        <div style={{ fontSize: "13px", color: "var(--text-3)", maxWidth: "300px" }}>{description}</div>
      )}
      {action && <div style={{ marginTop: "12px" }}>{action}</div>}
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({
  title, subtitle, action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      marginBottom: "24px", gap: "16px",
    }}>
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: subtitle ? "4px" : 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: "13px", color: "var(--text-2)" }}>{subtitle}</p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {label && (
        <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-2)" }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          padding: "9px 12px", fontSize: "13px",
          border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
          borderRadius: "var(--radius)", background: "var(--surface)",
          color: "var(--text)", fontFamily: "var(--font-main)",
          outline: "none", transition: "border-color 0.12s",
          width: "100%",
          ...style,
        }}
        onFocus={(e) => { e.target.style.borderColor = error ? "var(--danger)" : "var(--brand)"; props.onFocus?.(e); }}
        onBlur={(e) => { e.target.style.borderColor = error ? "var(--danger)" : "var(--border)"; props.onBlur?.(e); }}
      />
      {error && <span style={{ fontSize: "11px", color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, children, style, ...props }: SelectProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {label && (
        <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-2)" }}>
          {label}
        </label>
      )}
      <select
        {...props}
        style={{
          padding: "9px 12px", fontSize: "13px",
          border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
          borderRadius: "var(--radius)", background: "var(--surface)",
          color: "var(--text)", fontFamily: "var(--font-main)",
          outline: "none", transition: "border-color 0.12s",
          width: "100%", cursor: "pointer",
          ...style,
        }}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: "11px", color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}

// ─── Textarea ────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, style, ...props }: TextareaProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {label && (
        <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-2)" }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        style={{
          padding: "9px 12px", fontSize: "13px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)", background: "var(--surface)",
          color: "var(--text)", fontFamily: "var(--font-main)",
          outline: "none", resize: "vertical", minHeight: "80px",
          transition: "border-color 0.12s", width: "100%",
          ...style,
        }}
        onFocus={(e) => { e.target.style.borderColor = "var(--brand)"; props.onFocus?.(e); }}
        onBlur={(e) => { e.target.style.borderColor = "var(--border)"; props.onBlur?.(e); }}
      />
    </div>
  );
}

// ─── FormRow ─────────────────────────────────────────────────────────────────
export function FormRow({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
      gap: "14px",
    }}>
      {children}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" }}>
      <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
      <span style={{ fontSize: "11px", color: "var(--text-3)", whiteSpace: "nowrap" }}>{label}</span>
      <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
    </div>
  );
}
