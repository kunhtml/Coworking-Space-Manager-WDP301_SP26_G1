import { Button, Modal, Spinner } from "react-bootstrap";

export default function BookingConfirmationModal({
  show,
  onHide,
  selectedTable,
  getSelectedTypeInfo,
  selectedDate,
  selectedTimeStart,
  selectedTimeEnd,
  formatPrice,
  calculateTotalPrice,
  onConfirm,
  bookingLoading,
}) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">
          <i className="bi bi-check-circle text-success me-2"></i>
          Xác nhận đặt chỗ
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {selectedTable ? (
          <div>
            <h6 className="fw-semibold mb-3">Thông tin đặt chỗ:</h6>
            <div className="bg-light rounded-3 p-3 mb-3">
              <div className="row g-2">
                <div className="col-6">
                  <strong>Chỗ ngồi:</strong> {selectedTable.name}
                </div>
                <div className="col-6">
                  <strong>Loại:</strong> {getSelectedTypeInfo()?.title}
                </div>
                <div className="col-6">
                  <strong>Ngày:</strong> {new Date(selectedDate).toLocaleDateString("vi-VN")}
                </div>
                <div className="col-6">
                  <strong>Thời gian:</strong> {selectedTimeStart} - {selectedTimeEnd}
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center p-3 bg-primary bg-opacity-10 rounded-3">
              <span className="fw-semibold">Tổng tiền:</span>
              <span className="fw-bold text-primary h5 mb-0">{formatPrice(calculateTotalPrice())}</span>
            </div>
          </div>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Hủy
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={bookingLoading}>
          {bookingLoading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Đang đặt...
            </>
          ) : (
            <>
              <i className="bi bi-credit-card me-2"></i>
              Thanh toán
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
