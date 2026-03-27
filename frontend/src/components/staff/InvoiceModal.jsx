import { Alert, Button, Modal, Spinner } from "react-bootstrap";

export default function InvoiceModal({
  show,
  onClose,
  invoiceLoading,
  invoiceData,
  toDate,
  toTime,
  fmtCur,
  exporting,
  onExport,
}) {
  return (
    <Modal show={show} onHide={onClose} size="md" centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">Hoa don</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-2">
        {invoiceLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" style={{ color: "#6366f1" }} />
            <p className="mt-2 text-muted small fw-semibold">
              Dang tai hoa don...
            </p>
          </div>
        ) : !invoiceData ? (
          <Alert variant="secondary" className="mb-0">
            Khong co du lieu hoa don.
          </Alert>
        ) : (
          <div>
            <div className="text-center mb-4">
              <div className="fw-bold fs-5" style={{ color: "#6366f1" }}>
                {invoiceData.invoiceCode}
              </div>
              <div className="text-muted small">
                {toDate(invoiceData.createdAt)} ·{" "}
                {toTime(invoiceData.createdAt)}
              </div>
            </div>

            <div
              className="rounded-3 p-3 mb-3"
              style={{ background: "#f8fafc", fontSize: "0.85rem" }}
            >
              {[
                ["Ma order", invoiceData.order?.orderCode],
                ["Khach hang", invoiceData.customer?.name || "Khach le"],
                ["SDT", invoiceData.customer?.phone || "--"],
                ["Ban", invoiceData.table?.name || "--"],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className="d-flex justify-content-between py-1 border-bottom"
                >
                  <span style={{ color: "#64748b" }}>{label}</span>
                  <strong style={{ color: "#0f172a" }}>{val}</strong>
                </div>
              ))}
            </div>

            <h6 className="fw-bold mb-2">Danh sach mon</h6>
            <div
              className="rounded-3 overflow-hidden mb-3"
              style={{ border: "1px solid #e2e8f0" }}
            >
              {(invoiceData.items || []).map((line, idx) => (
                <div
                  key={`${line.menuName}-${idx}`}
                  className="d-flex justify-content-between align-items-center px-3 py-2"
                  style={{
                    borderBottom:
                      idx < invoiceData.items.length - 1
                        ? "1px solid #f1f5f9"
                        : "none",
                  }}
                >
                  <div>
                    <div
                      className="fw-semibold"
                      style={{ fontSize: "0.87rem" }}
                    >
                      {line.menuName}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>
                      {fmtCur(line.priceAtOrder)} x {line.quantity}
                    </div>
                  </div>
                  <strong style={{ color: "#15803d" }}>
                    {fmtCur(line.lineTotal)}
                  </strong>
                </div>
              ))}
            </div>

            <div
              className="rounded-3 p-3"
              style={{ background: "#f8fafc", fontSize: "0.88rem" }}
            >
              <div className="d-flex justify-content-between mb-2">
                <span style={{ color: "#64748b" }}>Tam tinh dich vu</span>
                <strong>{fmtCur(invoiceData.summary?.subTotal)}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span style={{ color: "#64748b" }}>Dat coc booking</span>
                <strong style={{ color: "#15803d" }}>
                  +{fmtCur(invoiceData.summary?.depositAmount)}
                </strong>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between">
                <span className="fw-bold fs-6">Tong can thanh toan</span>
                <strong className="fs-5" style={{ color: "#6366f1" }}>
                  {fmtCur(invoiceData.summary?.totalAmount)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 px-4 pb-4 gap-2">
        <Button
          variant="outline-secondary"
          className="fw-semibold rounded-3"
          onClick={onClose}
        >
          Dong
        </Button>
        <Button
          className="fw-bold rounded-3"
          style={{
            background: invoiceData ? "#6366f1" : "#94a3b8",
            border: "none",
          }}
          disabled={!invoiceData || exporting}
          onClick={onExport}
        >
          {exporting ? (
            <>
              <Spinner size="sm" className="me-1" />
              Dang xuat...
            </>
          ) : (
            <>
              <i className="bi bi-download me-1" />
              Xuat hoa don (CSV)
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
