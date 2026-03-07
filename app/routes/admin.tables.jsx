import mongoose from "mongoose";

const Table = mongoose.models.Table || mongoose.model("Table", new mongoose.Schema({
  tableName: String, capacity: Number, status: String
}), "tables");

export async function loader() {
  const tables = await Table.find().lean();
  return ({ tables });
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