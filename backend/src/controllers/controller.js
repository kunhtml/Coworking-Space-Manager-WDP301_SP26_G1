import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Booking from "../models/booking.js";
import Table from "../models/table.js";

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email/số điện thoại và mật khẩu." });
    }

    // Tìm user bằng email hoặc phone
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { phone: identifier.trim() },
      ],
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Email/số điện thoại hoặc mật khẩu không đúng." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email/số điện thoại hoặc mật khẩu không đúng." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "nexus_secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập thành công!",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        membershipStatus: user.membershipStatus,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại." });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng." });
    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      membershipStatus: user.membershipStatus,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server." });
  }
};

// PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;
    if (!fullName?.trim() || !email?.trim()) {
      return res.status(400).json({ message: "Họ tên và email không được để trống." });
    }
    const emailLower = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return res.status(400).json({ message: "Email không đúng định dạng." });
    }
    const existing = await User.findOne({ email: emailLower, _id: { $ne: req.user.id } }).lean();
    if (existing) return res.status(409).json({ message: "Email đã được sử dụng bởi tài khoản khác." });
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { fullName: fullName.trim(), email: emailLower, phone: phone?.trim() || "" },
      { new: true }
    ).lean();
    res.json({
      id: updated._id,
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone || "",
      role: updated.role,
      membershipStatus: updated.membershipStatus,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server." });
  }
};

// PUT /api/auth/password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp." });
    }
    const user = await User.findById(req.user.id).lean();
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Mật khẩu hiện tại không đúng." });
    const hash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user.id, { passwordHash: hash });
    res.json({ message: "Đổi mật khẩu thành công." });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server." });
  }
};

// GET /api/bookings/my  (Customer)
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    const tableIds = [...new Set(bookings.map((b) => b.tableId?.toString()).filter(Boolean))];
    const tables = await Table.find({ _id: { $in: tableIds } }).lean();
    const tableMap = new Map(tables.map((t) => [t._id.toString(), t]));

    const rows = bookings.map((b) => {
      const table = tableMap.get(b.tableId?.toString());
      return {
        id: b._id,
        bookingCode: b.bookingCode || b._id.toString().slice(-6).toUpperCase(),
        spaceName: table?.name || "Không xác định",
        startTime: b.startTime,
        endTime: b.endTime,
        depositAmount: b.depositAmount || 0,
        status: b.status || "Pending",
        createdAt: b.createdAt,
      };
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server." });
  }
};
