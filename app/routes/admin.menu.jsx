import mongoose from "mongoose";

const Category = mongoose.models.Category || mongoose.model("Category", new mongoose.Schema({
  name: String
}), "categories");

const Product = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({
  name: String, price: Number, categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, status: String
}), "menu_items");

export async function loader() {
  const categories = await Category.find().lean();
  const products = await Product.find().populate("categoryId").lean();
  return { categories, products };
}

export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save-category") {
    const id = formData.get("id");
    const name = formData.get("name");
    id ? await Category.findByIdAndUpdate(id, { name }) : await Category.create({ name });
  }

  if (intent === "save-product") {
    const id = formData.get("id");
    const productData = {
      name: formData.get("name"),
      price: Number(formData.get("price")),
      categoryId: formData.get("categoryId"),
      status: formData.get("status")
    };
    id ? await Product.findByIdAndUpdate(id, productData) : await Product.create(productData);
  }
  return { success: true };
}