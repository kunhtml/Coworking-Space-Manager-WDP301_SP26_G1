import mongoose from "mongoose";
import { useState } from "react";
import { Container, Table, Button, Badge, Modal, Form, Row, Col } from "react-bootstrap";

const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
  fullName: String, email: String, phone: String, role: String, status: String
}), "users");

export default function AdminAccounts() {
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="min-vh-100 bg-black text-light font-monospace py-5">
      <Container>
        <div className="d-flex justify-content-between align-items-end mb-5 border-bottom border-secondary pb-3">
          <div>
            <h1 className="display-5 fw-bold text-uppercase mb-0">Quản lý tài khoản</h1>
            <p className="text-secondary mb-0">Danh sách nhân viên và khách hàng hệ thống</p>
          </div>
          <Button variant="light" className="rounded-0 fw-bold text-uppercase px-4">
            + Thêm tài khoản
          </Button>
        </div>

        <Table responsive variant="dark" className="border border-secondary">
          <thead className="text-secondary text-uppercase small">
            <tr>
              <th>Họ tên</th>
              <th>Email / SĐT</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th className="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {/* Dữ liệu mẫu khớp với Compass */}
            <tr>
              <td className="fw-bold">Nguyễn Văn Admin</td>
              <td>admin@coworking.com <br/> <small className="text-secondary">0901234567</small></td>
              <td><Badge bg="info" className="rounded-0">Admin</Badge></td>
              <td><Badge bg="success" className="rounded-0">Active</Badge></td>
              <td className="text-end">
                <Button variant="outline-secondary" size="sm" className="rounded-0 text-uppercase fw-bold">Sửa</Button>
              </td>
            </tr>
          </tbody>
        </Table>
      </Container>
    </div>
  );
}

export async function loader() {
  const accounts = await User.find().lean();
  return { accounts }; // Trả về object trực tiếp
}

export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id");

  if (intent === "create") {
    await User.create({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      role: formData.get("role"),
      status: "Active"
    });
    return { success: true };
  }

  if (intent === "update") {
    const otp = formData.get("otp");
    if (otp !== "123456") {
       // Thay vì dùng json(), ta ném lỗi hoặc trả về object kèm status nếu cần
       return { error: "Invalid OTP", status: 400 }; 
    }

    await User.findByIdAndUpdate(id, {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      status: formData.get("status")
    });
    return { success: true };
  }
}