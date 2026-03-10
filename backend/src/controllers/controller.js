import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

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
