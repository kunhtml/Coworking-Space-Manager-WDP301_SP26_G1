import { Button, Col, Form, Row } from "react-bootstrap";

export default function HistoryFilterBar({
  search,
  onSearchChange,
  dateFilter,
  onDateChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  onReset,
  searchPlaceholder,
}) {
  return (
    <Row className="g-3 mb-3">
      <Col md={5}>
        <Form.Control
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </Col>
      <Col md={3}>
        <Form.Control type="date" value={dateFilter} onChange={(e) => onDateChange(e.target.value)} />
      </Col>
      <Col md={3}>
        <Form.Select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          {statusOptions.map(([value, cfg]) => (
            <option key={value} value={value}>
              {cfg.label}
            </option>
          ))}
        </Form.Select>
      </Col>
      <Col md={1}>
        <Button variant="outline-secondary" className="w-100" onClick={onReset}>
          <i className="bi bi-arrow-counterclockwise"></i>
        </Button>
      </Col>
    </Row>
  );
}
