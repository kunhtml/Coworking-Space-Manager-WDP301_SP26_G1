import { useState } from "react";
import { Container, Table, Button, Badge, Modal, Form } from "react-bootstrap"; 
import mongoose from "mongoose";
import { useLoaderData } from "react-router";
import { connectDB } from "../db.server";

const TableModel = mongoose.models.Table || mongoose.model("Table", new mongoose.Schema({
  tableName: String, 
  capacity: Number, 
  status: String
}), "tables");

export default function AdminTables() {
  const { tables } = useLoaderData(); // Lấy dữ liệu thật từ loader

  return (
    <div className="min-vh-100 bg-black text-light font-monospace py-5">
      <Container>
        <div className="d-flex justify-content-between align-items-end mb-5 border-bottom border-secondary pb-3">
          <h1 className="display-5 fw-bold text-uppercase mb-0">Thiết lập sơ đồ bàn</h1>
          <Button variant="light" className="rounded-0 fw-bold px-4 text-uppercase">+ Thêm bàn</Button>
        </div>

        {/* Component Table của Bootstrap vẫn giữ nguyên tên gọi */}
        <Table responsive variant="dark" className="border border-secondary">
          <thead className="text-secondary text-uppercase small">
            <tr>
              <th>Mã bàn</th>
              <th>Sức chứa</th>
              <th>Trạng thái</th>
              <th className="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table) => (
              <tr key={table._id} className="align-middle">
                <td className="fw-bold text-info">{table.tableName}</td>
                <td>{table.capacity} người</td>
                <td>
                  <Badge className="rounded-0 text-uppercase" bg={
                    table.status === "Available" ? "success" : "danger"
                  }>
                    {table.status}
                  </Badge>
                </td>
                <td className="text-end">
                  <Button variant="outline-secondary" size="sm" className="rounded-0">SỬA</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </div>
  );
}

export async function loader() {
  await connectDB();
  // 2. GỌI ĐÚNG TÊN BIẾN MỚI: TableModel.find() thay vì Table.find()
  const tables = await TableModel.find().lean(); 
  return { tables };
}

export async function action({ request }) {
  const formData = await request.formData();
  const id = formData.get("id");
  const tableData = {
    tableName: formData.get("tableName"),
    capacity: Number(formData.get("capacity")),
    status: formData.get("status")
  };

  id ? await Table.findByIdAndUpdate(id, tableData) : await Table.create(tableData);
  return ({ success: true });
}