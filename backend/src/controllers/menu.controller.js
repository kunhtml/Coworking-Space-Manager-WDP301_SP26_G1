import MenuItem from "../models/menu_item.js";
import Category from "../models/category.js";

export const getMenuItems = async (req, res) => {
  try {
    const isAdmin = req.query.admin === "true";

    if (isAdmin) {
      // Admin: lấy tất cả món không lọc
      const items = await MenuItem.find().populate("categoryId", "name isActive").lean();
      return res.json(items);
    }

    // Public (khách hàng): chỉ lấy món của danh mục đang hiển thị
    // và loại bỏ món Hết hàng (Unavailable)
    const activeCategories = await Category.find({ isActive: true }).select("_id").lean();
    const activeCatIds = activeCategories.map((c) => c._id);

    const items = await MenuItem.find({
      availabilityStatus: { $ne: "Unavailable" }, // ẩn món hết hàng hẳn
      $or: [
        { categoryId: { $in: activeCatIds } }, // danh mục đang hiển thị
        { categoryId: null },                   // món không có danh mục
      ],
    })
      .populate("categoryId", "name isActive")
      .lean();

    return res.json(items);
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
    // Nếu admin chọn Unavailable (hết hàng hẳn), giữ nguyên.
    // Nếu tồn kho = 0 và không phải Unavailable → tự động OutOfStock
    let resolvedStatus = availabilityStatus || "Available";
    if (resolvedStatus !== "Unavailable" && qty === 0) {
      resolvedStatus = "OutOfStock";
    } else if (resolvedStatus === "OutOfStock" && qty > 0) {
      resolvedStatus = "Available";
    }

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
    // Tương tự createMenuItem: auto OutOfStock khi hết hàng tmpThời
    let resolvedStatus = availabilityStatus || "Available";
    if (resolvedStatus !== "Unavailable" && qty === 0) {
      resolvedStatus = "OutOfStock";
    } else if (resolvedStatus === "OutOfStock" && qty > 0) {
      resolvedStatus = "Available";
    }

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
      { new: true },
    )
      .populate("categoryId", "name")
      .lean();

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
    const categories = await Category.find().lean();
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
      return res.status(400).json({ message: "Tên danh mục không được để trống." });
    }
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        description: description?.trim() || "",
        isActive: isActive !== false,
      },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Không tìm thấy danh mục." });
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
        message: "Không thể xóa danh mục đang chứa sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm trước." 
      });
    }

    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy danh mục." });
    res.json({ message: "Xoá danh mục thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xoá danh mục." });
  }
};

// ==================== USER MANAGEMENT ====================
