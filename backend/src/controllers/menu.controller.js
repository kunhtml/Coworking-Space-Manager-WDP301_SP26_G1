import MenuItem from "../models/menu_item.js";
import Category from "../models/category.js";
import jwt from "jsonwebtoken";

const toRoleKey = (role) =>
  String(role || "")
    .trim()
    .toLowerCase();

const getRequesterRole = (req) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  if (!process.env.JWT_SECRET) return null;

  try {
    const token = auth.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return toRoleKey(user?.role);
  } catch {
    return null;
  }
};

const canUseAdminMenuView = (req) => {
  const role = getRequesterRole(req);
  if (!role) return false;

  const requestedAdminScope =
    req.query.admin === "true" || req.query.scope === "all";
  if (!requestedAdminScope) return false;

  return role === "staff" || role === "admin";
};

const resolveAvailabilityStatus = (availabilityStatus, stockQuantity) => {
  const qty = Number(stockQuantity || 0);
  if (availabilityStatus && ["AVAILABLE", "OUT_OF_STOCK", "UNAVAILABLE"].includes(availabilityStatus)) {
    return availabilityStatus;
  }
  return qty > 0 ? "AVAILABLE" : "OUT_OF_STOCK";
};

export const getMenuItems = async (req, res) => {
  try {
    const isAdmin = canUseAdminMenuView(req);

    if (isAdmin) {
      // Admin: lấy tất cả món không lọc
      const items = await MenuItem.find()
        .populate("categoryId", "name isActive")
        .lean();
      return res.json(items);
    }

    // Public (khách hàng): chỉ lấy món của danh mục đang hiển thị
    // và loại bỏ món Hết hàng (Unavailable)
    const activeCategories = await Category.find({ isActive: true })
      .select("_id")
      .lean();
    const activeCatIds = activeCategories.map((c) => c._id);

    const items = await MenuItem.find({
      $or: [{ categoryId: { $in: activeCatIds } }, { categoryId: null }],
    })
      .populate("categoryId", "name isActive")
      .lean();

    const publicItems = items.filter(
      (item) => item.availabilityStatus === "AVAILABLE",
    );

    return res.json(publicItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tải danh sách menu." });
  }
};

// GET /api/menu/items/:id

export const getMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id)
      .populate("categoryId", "name")
      .lean();
    if (!item) return res.status(404).json({ message: "Không tìm thấy món." });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tải thông tin món." });
  }
};

// POST /api/menu/items

export const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      categoryId,
      description,
      price,
      stockQuantity,
      availabilityStatus,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Tên món không được để trống." });
    }
    if (!price || price < 0) {
      return res.status(400).json({ message: "Giá không hợp lệ." });
    }

    const qty = Number(stockQuantity) || 0;
    const resolvedStatus = resolveAvailabilityStatus(availabilityStatus, qty);

    const newItem = await MenuItem.create({
      name: name.trim(),
      categoryId: categoryId || null,
      description: description?.trim() || "",
      price: Number(price),
      stockQuantity: qty,
      availabilityStatus: resolvedStatus,
    });

    const populated = await MenuItem.findById(newItem._id)
      .populate("categoryId", "name")
      .lean();
    res.status(201).json({ message: "Thêm món thành công!", item: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi thêm món." });
  }
};

// PUT /api/menu/items/:id

export const updateMenuItem = async (req, res) => {
  try {
    const {
      name,
      categoryId,
      description,
      price,
      stockQuantity,
      availabilityStatus,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Tên món không được để trống." });
    }
    if (price !== undefined && price < 0) {
      return res.status(400).json({ message: "Giá không hợp lệ." });
    }

    const qty = Number(stockQuantity) || 0;
    const resolvedStatus = resolveAvailabilityStatus(availabilityStatus, qty);

    const updated = await MenuItem.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        categoryId: categoryId || null,
        description: description?.trim() || "",
        price: Number(price),
        stockQuantity: qty,
        availabilityStatus: resolvedStatus,
      },
      { returnDocument: "after" },
    ).lean();

    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy món." });
    res.json({ message: "Cập nhật món thành công!", item: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật món." });
  }
};

// DELETE /api/menu/items/:id

export const deleteMenuItem = async (req, res) => {
  try {
    const deleted = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy món." });
    res.json({ message: "Xoá món thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xoá món." });
  }
};

// GET /api/menu/categories

export const getCategories = async (req, res) => {
  try {
    const isAdmin = canUseAdminMenuView(req);
    const categories = isAdmin
      ? await Category.find().lean()
      : await Category.find({ isActive: true }).lean();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tải danh mục." });
  }
};

// POST /api/menu/categories

export const createCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    if (!name?.trim()) {
      return res
        .status(400)
        .json({ message: "Tên danh mục không được để trống." });
    }
    const newCat = await Category.create({
      name: name.trim(),
      description: description?.trim() || "",
      isActive: isActive !== false,
    });
    res
      .status(201)
      .json({ message: "Thêm danh mục thành công!", category: newCat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi thêm danh mục." });
  }
};

// PUT /api/menu/categories/:id

export const updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    if (!name?.trim()) {
      return res
        .status(400)
        .json({ message: "Tên danh mục không được để trống." });
    }
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        description: description?.trim() || "",
        isActive: isActive !== false,
      },
      { returnDocument: "after" },
    ).lean();

    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy danh mục." });
    res.json({ message: "Cập nhật danh mục thành công!", category: updated });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi cập nhật danh mục." });
  }
};

// DELETE /api/menu/categories/:id

export const deleteCategory = async (req, res) => {
  try {
    // Kiểm tra xem có sản phẩm nào đang thuộc danh mục này không trước khi xóa
    const hasProducts = await MenuItem.findOne({ categoryId: req.params.id });
    if (hasProducts) {
      return res.status(400).json({
        message:
          "Không thể xóa danh mục đang chứa sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm trước.",
      });
    }

    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy danh mục." });
    res.json({ message: "Xoá danh mục thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xoá danh mục." });
  }
};

// ==================== USER MANAGEMENT ====================



