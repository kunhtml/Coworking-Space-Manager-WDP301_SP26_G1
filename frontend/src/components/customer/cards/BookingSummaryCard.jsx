import { Card } from "react-bootstrap";

export default function BookingSummaryCard({
  selectedType,
  getSelectedTypeInfo,
  selectedDate,
  selectedTimeStart,
  selectedTimeEnd,
  calculateDuration,
  selectedTable,
  formatPrice,
  calculateTotalPrice,
}) {
  return (
    <div className="sticky-top" style={{ top: "100px" }}>
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Header className="bg-primary text-white border-0 p-4">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-receipt me-2"></i>
            Tóm tắt đặt chỗ
          </h5>
        </Card.Header>
        <Card.Body className="p-4">
          {selectedType ? (
            <>
              <div className="mb-3">
                <h6 className="fw-semibold mb-1">Loại chỗ ngồi</h6>
                <p className="text-muted mb-0">{getSelectedTypeInfo()?.title}</p>
              </div>

              {selectedDate ? (
                <div className="mb-3">
                  <h6 className="fw-semibold mb-1">Ngày</h6>
                  <p className="text-muted mb-0">
                    {new Date(selectedDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              ) : null}

              {selectedTimeStart && selectedTimeEnd ? (
                <div className="mb-3">
                  <h6 className="fw-semibold mb-1">Thời gian</h6>
                  <p className="text-muted mb-0">
                    {selectedTimeStart} - {selectedTimeEnd}
                    <br />
                    <small>({calculateDuration()} giờ)</small>
                  </p>
                </div>
              ) : null}

              {selectedTable ? (
                <div className="mb-3">
                  <h6 className="fw-semibold mb-1">Chỗ ngồi</h6>
                  <p className="text-muted mb-0">{selectedTable.name}</p>
                </div>
              ) : null}

              {calculateDuration() > 0 ? (
                <>
                  <hr />
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">Tổng tiền:</span>
                    <span className="fw-bold text-primary h5 mb-0">{formatPrice(calculateTotalPrice())}</span>
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="text-center py-4">
              <i className="bi bi-calendar-x text-muted" style={{ fontSize: "3rem" }}></i>
              <p className="text-muted mt-2 mb-0">Chọn loại chỗ ngồi để xem tóm tắt</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
