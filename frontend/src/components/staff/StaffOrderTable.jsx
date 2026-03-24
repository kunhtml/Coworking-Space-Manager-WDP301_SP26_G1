import OrderTable from "./OrderTable";

export default function StaffOrderTable({ onStatusChange, onComplete, ...rest }) {
  return <OrderTable onComplete={onStatusChange || onComplete} {...rest} />;
}
