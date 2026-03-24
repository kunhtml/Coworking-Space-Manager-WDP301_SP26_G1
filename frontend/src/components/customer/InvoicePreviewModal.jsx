import { Button, Modal } from "react-bootstrap";

export default function InvoicePreviewModal({
  show,
  onClose,
  onPrint,
  printLabel,
  children,
}) {
  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Body className="p-4">
        <div className="border rounded-4 p-4">{children}</div>
      </Modal.Body>
      <Modal.Footer className="border-0 d-flex gap-2">
        <Button variant="outline-secondary" className="w-100" onClick={onClose}>
          Đóng
        </Button>
        <Button className="w-100" variant="primary" onClick={onPrint}>
          <i className="bi bi-printer me-2"></i>
          {printLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
