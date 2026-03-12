import { Container, Row, Col, Button, Badge } from "react-bootstrap";
import { useLoaderData } from "react-router";
import mongoose from "mongoose";
import { connectDB } from "../db.server";

/**
 * TIER 3: DATABASE SCHEMA (Khớp chính xác với Compass của bạn)
 */
const Category = mongoose.models.Category || mongoose.model("Category", new mongoose.Schema({
  name: String,
  description: String,
  isActive: Boolean
}), "categories");

const Product = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  stockQuantity: Number,
  availabilityStatus: String,
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
}), "menu_items");

/**
 * TIER 2: SERVER LOGIC (Loader & Action)
 */
export async function loader() {
  await connectDB();
  const categories = await Category.find().lean();
  const products = await Product.find().populate("categoryId").lean();
  return { categories, products };
}

export async function action({ request }) {
  await connectDB();
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save-product") {
    const id = formData.get("id");
    const productData = {
      name: formData.get("name"),
      price: Number(formData.get("price")),
      stockQuantity: Number(formData.get("stockQuantity")),
      availabilityStatus: formData.get("status"),
      categoryId: formData.get("categoryId")
    };
    id ? await Product.findByIdAndUpdate(id, productData) : await Product.create(productData);
  }
  return { success: true };
}

/**
 * TIER 1: PRESENTATION (Giao diện Admin)
 */
export default function AdminMenu() {
  const { products } = useLoaderData(); 

  return (
    <div className="min-vh-100 bg-black text-light font-monospace py-5">
      <Container>
        <div className="d-flex justify-content-between align-items-end mb-5 border-bottom border-secondary pb-3">
          <div>
            <h1 className="display-5 fw-bold text-uppercase mb-0">Quản lý thực đơn</h1>
            <p className="text-secondary small">Cấu hình món ăn và lượng tồn kho thực tế</p>
          </div>
          <Button variant="light" className="rounded-0 fw-bold px-4 text-uppercase">+ Thêm món mới</Button>
        </div>

        <Row className="g-4"> 
          {products.map((item) => (
            <Col key={item._id} md={6} lg={4}>
              <div className="p-4 border border-secondary bg-dark h-100 transition-all hover-bg-black">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="text-white text-uppercase mb-1">{item.name}</h5>
                    <Badge bg="secondary" className="rounded-0 small text-uppercase">
                      {item.categoryId?.name || "No Category"}
                    </Badge>
                  </div>
                  <span className="text-warning fw-bold">{item.price?.toLocaleString()}đ</span>
                </div>
                
                <div className="mb-4 small text-secondary">
                  <div>Tồn kho: <span className="text-white">{item.stockQuantity || 0}</span></div>
                  <div>Trạng thái: 
                    <span className={item.availabilityStatus === "In_Stock" ? "text-success" : "text-danger"}>
                       {item.availabilityStatus === "In_Stock" ? " Còn hàng" : " Hết hàng"}
                    </span>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" size="sm" className="rounded-0 fw-bold flex-grow-1">SỬA</Button>
                  <Button variant="outline-danger" size="sm" className="rounded-0 fw-bold flex-grow-1">XÓA</Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}