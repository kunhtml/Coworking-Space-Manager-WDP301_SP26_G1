export default function ActionButtons({ actions = [] }) {
  return (
    <div className="d-flex gap-2">
      {actions
        .filter((a) => !a.hidden)
        .map((a) => (
          <button
            key={a.key}
            className={a.className || "staff-icon-btn"}
            type="button"
            title={a.title}
            onClick={a.onClick}
            disabled={Boolean(a.disabled)}
            style={a.style}
          >
            {a.icon ? <i className={`bi ${a.icon}`} /> : a.label}
          </button>
        ))}
    </div>
  );
}
