import { Button, Modal, Spinner } from "react-bootstrap";

export default function ConfirmModal({
  show,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xac nhan",
  cancelText = "Huy",
  loading = false,
  children,
}) {
  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold fs-6">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-2">
        {message ? <p className="text-muted small mb-3">{message}</p> : null}
        {children}
      </Modal.Body>
      <Modal.Footer className="border-0 px-4 pb-4 gap-2">
        <Button
          variant="outline-secondary"
          className="fw-semibold rounded-3 flex-grow-1"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          className="fw-bold rounded-3 flex-grow-1"
          style={{ background: "#6366f1", border: "none" }}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <><Spinner size="sm" className="me-1" />Dang xu ly...</> : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
