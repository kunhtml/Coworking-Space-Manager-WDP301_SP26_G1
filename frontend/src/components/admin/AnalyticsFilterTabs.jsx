export default function AnalyticsFilterTabs({ filterTab, onChange }) {
  const tabs = [
    { value: "today", label: "Hôm nay", text: "Today" },
    { value: "week", label: "Tuần này", text: "This Week" },
    { value: "month", label: "Tháng này", text: "This Month" },
  ];

  return (
    <div
      className="mb-5 d-flex gap-3"
      style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "0" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          style={{
            padding: "12px 20px",
            border: "none",
            backgroundColor: "transparent",
            borderBottom: filterTab === tab.value ? "3px solid #8b5cf6" : "none",
            color: filterTab === tab.value ? "#8b5cf6" : "#94a3b8",
            fontWeight: filterTab === tab.value ? "600" : "500",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (filterTab !== tab.value) {
              e.target.style.color = "#64748b";
            }
          }}
          onMouseLeave={(e) => {
            if (filterTab !== tab.value) {
              e.target.style.color = "#94a3b8";
            }
          }}
          title={tab.text}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
