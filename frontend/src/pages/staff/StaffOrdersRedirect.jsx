import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";

/**
 * Component redirect từ /staff/orders sang /staff-dashboard/orders
 * Để xử lý các payment link cũ đã được tạo trước khi sửa code
 */
export default function StaffOrdersRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Giữ nguyên query params (payment status, code, etc.)
    navigate(`/staff-dashboard/orders${location.search}`, { replace: true });
  }, [navigate, location.search]);

  return null;
}
