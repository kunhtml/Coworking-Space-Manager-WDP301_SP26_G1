import { Card } from "react-bootstrap";

export default function TopSpacesTableCard({ topSpaces, getColorForUsage }) {
  return (
    <Card
      className="border-0"
      style={{
        backgroundColor: "white",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        borderRadius: "12px",
      }}
    >
      <Card.Body className="p-4">
        <h5
          className="mb-4 fw-bold"
          style={{ fontSize: "16px", color: "#1e293b" }}
        >
          <i
            className="bi bi-trophy"
            style={{ color: "#f59e0b", marginRight: "8px" }}
          ></i>
          Xếp hạng không gian được sử dụng nhiều nhất
        </h5>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <th style={headerCellStyle}>#</th>
                <th style={headerCellStyle}>KHÔNG GIAN</th>
                <th style={headerCellStyle}>LOẠI</th>
                <th style={headerCellStyle}>SỐ PHIÊN</th>
                <th style={headerCellStyle}>TỔNG GIỜ</th>
                <th style={headerCellStyle}>DOANH THU</th>
                <th style={headerCellStyle}>TỶ LỆ SỬ DỤNG</th>
              </tr>
            </thead>
            <tbody>
              {topSpaces.map((space, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    backgroundColor: idx % 2 === 0 ? "transparent" : "#f9fafb",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      idx % 2 === 0 ? "transparent" : "#f9fafb";
                  }}
                >
                  <td style={rankCellStyle}>{space.rank}</td>
                  <td style={valueCellStyle}>{space.space}</td>
                  <td style={bodyCellStyle}>{space.type}</td>
                  <td style={bodyCellStyle}>{space.sessions} phiên</td>
                  <td style={bodyCellStyle}>{space.totalHours}</td>
                  <td style={valueCellStyle}>{space.revenue}</td>
                  <td style={{ padding: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: "4px",
                          backgroundColor: "#e2e8f0",
                          borderRadius: "2px",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${space.usageRate}%`,
                            backgroundColor: getColorForUsage(space.usageRate),
                            borderRadius: "2px",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#1e293b",
                          minWidth: "32px",
                        }}
                      >
                        {space.usageRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );
}

const headerCellStyle = {
  padding: "12px",
  textAlign: "left",
  color: "#64748b",
  fontWeight: "600",
  fontSize: "12px",
};

const bodyCellStyle = {
  padding: "12px",
  color: "#64748b",
  fontSize: "13px",
};

const valueCellStyle = {
  padding: "12px",
  color: "#1e293b",
  fontSize: "13px",
  fontWeight: "600",
};

const rankCellStyle = {
  padding: "12px",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "600",
};
