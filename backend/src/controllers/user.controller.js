import bcrypt from "bcryptjs";
import User from "../models/user.js";
import { sendStaffAccountCreatedEmail } from "../services/email.service.js";

export const getAllUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let query = {};

    // Logic tìm kiếm đa năng: Tên, Email hoặc SĐT
    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    // Lọc theo vai trò và trạng thái hội viên
    if (role && role !== "Tất cả") query.role = role;
    if (status && status !== "Tất cả") query.membershipStatus = status;

    const users = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tải danh sách người dùng." });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tải thông tin người dùng." });
  }
};

export const createUser = async (req, res) => {
  try {
    const { fullName, email, password, phone, role, membershipStatus } =
      req.body;

    if (!email?.trim() || !password?.trim()) {
      return res
        .status(400)
        .json({ message: "Email và mật khẩu là bắt buộc." });
    }

    // Check if user exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "Email đã được sử dụng." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const normalizedRole = String(role || "Customer").trim();

    const newUser = await User.create({
      fullName: fullName?.trim() || "",
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone?.trim() || "",
      role: normalizedRole,
      membershipStatus: membershipStatus || "Active",
    });

    if (normalizedRole.toLowerCase() === "staff") {
      try {
        const creator = req.user?.id
          ? await User.findById(req.user.id).select("fullName").lean()
          : null;
        await sendStaffAccountCreatedEmail({
          to: newUser.email,
          fullName: newUser.fullName,
          loginEmail: newUser.email,
          temporaryPassword: password,
          createdBy: creator?.fullName || "Quản trị viên",
        });
      } catch (mailErr) {
        console.error("sendStaffAccountCreatedEmail error:", mailErr);
      }
    }

    const userResponse = newUser.toObject();
    delete userResponse.passwordHash;

    res.status(201).json({
      message: "Tạo người dùng thành công!",
      user: userResponse,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tạo người dùng." });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { fullName, email, phone, role, membershipStatus } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    // Check email uniqueness if changed
    if (email && email.toLowerCase().trim() !== user.email) {
      const existing = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: userId },
      });
      if (existing) {
        return res.status(400).json({ message: "Email đã được sử dụng." });
      }
    }

    // Update fields
    if (fullName !== undefined) user.fullName = fullName.trim();
    if (email !== undefined) user.email = email.toLowerCase().trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (role !== undefined) user.role = role;
    if (membershipStatus !== undefined)
      user.membershipStatus = membershipStatus;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    res.json({
      message: "Cập nhật người dùng thành công!",
      user: userResponse,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật người dùng." });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Don't allow deactivating yourself.
    if (req.user && String(req.user.id) === String(userId)) {
      return res
        .status(400)
        .json({ message: "Không thể vô hiệu hóa tài khoản của chính mình." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { membershipStatus: "Inactive" },
      { returnDocument: "after" },
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    res.json({
      message: "Đã vô hiệu hóa người dùng thành công.",
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa người dùng." });
  }
};
