import { Table as RBTable } from "react-bootstrap";

export default function Table({ className = "", responsive = true, children }) {
  return (
    <RBTable responsive={responsive} className={className}>
      {children}
    </RBTable>
  );
}
