export function Mark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M4 8h18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M22 8v8c0 8-12 8-12 0" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
