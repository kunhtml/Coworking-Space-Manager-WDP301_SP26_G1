import { Pagination } from "react-bootstrap";

export default function ListPagination({ page, totalPages, onChange }) {
  return (
    <div className="d-flex justify-content-center mt-3">
      <Pagination className="mb-0">
        <Pagination.Prev
          disabled={page === 1}
          onClick={() => onChange(Math.max(1, page - 1))}
        />
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Pagination.Item key={p} active={p === page} onClick={() => onChange(p)}>
            {p}
          </Pagination.Item>
        ))}
        <Pagination.Next
          disabled={page === totalPages}
          onClick={() => onChange(Math.min(totalPages, page + 1))}
        />
      </Pagination>
    </div>
  );
}
