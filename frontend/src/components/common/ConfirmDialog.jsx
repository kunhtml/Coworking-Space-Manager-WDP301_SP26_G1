import { Button } from "react-bootstrap";
import ModalWrapper from "./ModalWrapper";

export default function ConfirmDialog({
  show,
  onCancel,
  onConfirm,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
}) {
  return (
    <ModalWrapper
      show={show}
      onHide={onCancel}
      title={title}
      footer={(
        <>
          <Button variant="outline-secondary" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {confirmText}
          </Button>
        </>
      )}
    >
      <p className="mb-0">{message}</p>
    </ModalWrapper>
  );
}
