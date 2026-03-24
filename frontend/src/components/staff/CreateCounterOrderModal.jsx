import { Button, Form, Modal, Spinner } from "react-bootstrap";
import OrderForm from "./OrderForm";

export default function CreateCounterOrderModal({
  show,
  onClose,
  onSubmit,
  creating,
  createForm,
  setCreateForm,
  tables,
  menuItems,
  onChangeCreateItem,
  addCreateItem,
  removeCreateItem,
  fmtCur,
}) {
  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">🛒 Tạo đơn tại quầy (Counter Order)</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <OrderForm
            createForm={createForm}
            setCreateForm={setCreateForm}
            tables={tables}
            menuItems={menuItems}
            onChangeCreateItem={onChangeCreateItem}
            addCreateItem={addCreateItem}
            removeCreateItem={removeCreateItem}
            fmtCur={fmtCur}
          />
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 pb-4">
          <Button variant="outline-secondary" className="fw-semibold rounded-3" onClick={onClose}>
            Huy
          </Button>
          <Button
            type="submit"
            className="fw-bold rounded-3"
            style={{ background: "#6366f1", border: "none" }}
            disabled={creating}
          >
            {creating ? <><Spinner size="sm" className="me-1" />Dang tao...</> : "Tao don"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
