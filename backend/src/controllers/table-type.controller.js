import TableType from "../models/tableType.js";

export const getTableTypes = async (req, res) => {
  try {
    const types = await TableType.find().sort({ name: 1 }).lean();
    res.json(
      types.map((t) => ({
        sourceId: t._id.toString(),
        name: t.name,
        description: t.description || "",
        capacity: t.capacity || 1,
        createdAt: t.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: "Lỗi server." });
  }
};

// POST /api/table-types (Staff/Admin)

export const createTableType = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res
        .status(400)
        .json({ message: "Tên loại bàn không được để trống." });
    }
    const existing = await TableType.findOne({ name: name.trim() }).lean();
    if (existing) {
      return res.status(409).json({ message: "Loại bàn này đã tồn tại." });
    }
    const tableType = await TableType.create({
      name: name.trim(),
      description: description?.trim() || "",
      capacity: Number(req.body.capacity) || 1,
    });
    res.status(201).json({ message: "Thêm loại bàn thành công!", tableType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tạo loại bàn." });
  }
};

// PUT /api/table-types/:id (Staff/Admin)

export const updateTableType = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res
        .status(400)
        .json({ message: "Tên loại bàn không được để trống." });
    }
    const existing = await TableType.findOne({
      name: name.trim(),
      _id: { $ne: req.params.id },
    }).lean();
    if (existing) {
      return res.status(409).json({ message: "Tên loại bàn này đã tồn tại." });
    }
    const tableType = await TableType.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        description: description?.trim() || "",
        capacity: Number(req.body.capacity) || 1,
      },
      { new: true, runValidators: true },
    );
    if (!tableType)
      return res.status(404).json({ message: "Không tìm thấy loại bàn." });
    res.json({ message: "Cập nhật loại bàn thành công!", tableType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật loại bàn." });
  }
};

// DELETE /api/table-types/:id (Staff/Admin)

export const deleteTableType = async (req, res) => {
  try {
    const tableType = await TableType.findByIdAndDelete(req.params.id);
    if (!tableType)
      return res.status(404).json({ message: "Không tìm thấy loại bàn." });
    res.json({ message: "Xóa loại bàn thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa loại bàn." });
  }
};

// GET /api/reports/analytics (Staff/Admin)
