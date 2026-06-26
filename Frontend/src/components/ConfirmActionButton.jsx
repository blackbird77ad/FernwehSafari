import { useState } from "react";

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="button-icon" fill="none" viewBox="0 0 24 24">
      <path d="M4 7h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M10 11v6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M14 11v6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M6 7l1 14h10l1-14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M9 7V4h6v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export default function ConfirmActionButton({
  actionLabel = "Delete",
  children,
  className = "button danger compact",
  confirmMessage = "This action cannot be undone. Continue?",
  disabled = false,
  iconOnly = false,
  onConfirm,
  title,
  type = "button",
  ...props
}) {
  const [pending, setPending] = useState(false);
  const label = children || actionLabel;

  async function handleClick() {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setPending(true);
      await onConfirm?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      className={`${className} has-icon${iconOnly ? " icon-only" : ""}`}
      type={type}
      onClick={handleClick}
      disabled={pending || disabled}
      title={title || actionLabel}
      aria-label={iconOnly ? actionLabel : undefined}
      {...props}
    >
      <TrashIcon />
      {iconOnly ? <span className="sr-only">{pending ? "Working..." : label}</span> : <span>{pending ? "Working..." : label}</span>}
    </button>
  );
}
