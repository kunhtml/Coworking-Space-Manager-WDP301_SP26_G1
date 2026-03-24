import { Modal } from "react-bootstrap";

export default function ModalWrapper({
  show,
  onHide,
  title,
  size = "md",
  centered = true,
  children,
  footer,
}) {
  return (
    <Modal show={show} onHide={onHide} size={size} centered={centered}>
      <Modal.Header closeButton className="border-0">
        {title ? <Modal.Title className="fw-bold">{title}</Modal.Title> : null}
      </Modal.Header>
      <Modal.Body className="px-4 pb-2">{children}</Modal.Body>
      {footer ? <Modal.Footer className="border-0 px-4 pb-4">{footer}</Modal.Footer> : null}
    </Modal>
  );
}
