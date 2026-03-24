export default function SearchInput({ value, onChange, placeholder = "Search...", className = "" }) {
  return (
    <div className={`staff-search-wrap ${className}`.trim()}>
      <i className="bi bi-search" />
      <input value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}
