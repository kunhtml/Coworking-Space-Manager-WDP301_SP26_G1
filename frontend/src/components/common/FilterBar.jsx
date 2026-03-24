export default function FilterBar({ children, className = "" }) {
  return <div className={`row g-3 mb-4 align-items-center ${className}`.trim()}>{children}</div>;
}
