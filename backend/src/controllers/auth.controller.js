import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { sendOtpEmail, sendWelcomeEmail } from "../services/email.service.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_SESSION_TTL_MS = 10 * 60 * 1000;
const userOtpCache = new Map();
const userOtpVerifiedCache = new Map();
const emailOtpCache = new Map();
const emailOtpVerifiedCache = new Map();

const OTP_PURPOSE = {
  UPDATE_PROFILE: "UPDATE_PROFILE",
  CHANGE_PASSWORD: "CHANGE_PASSWORD",
  REGISTER: "REGISTER",
  FORGOT_PASSWORD: "FORGOT_PASSWORD",
};

const AUTHENTICATED_OTP_PURPOSES = [
  OTP_PURPOSE.UPDATE_PROFILE,
  OTP_PURPOSE.CHANGE_PASSWORD,
];

const PUBLIC_OTP_PURPOSES = [OTP_PURPOSE.REGISTER, OTP_PURPOSE.FORGOT_PASSWORD];

function requireJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }
}

function makeOtpKey(userId, purpose) {
  return `${String(userId)}:${String(purpose)}`;
}

function makeEmailOtpKey(email, purpose) {
  return `${String(email).trim().toLowerCase()}:${String(purpose)}`;
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function ensureOtpVerified(userId, purpose) {
  const key = makeOtpKey(userId, purpose);
  const verified = userOtpVerifiedCache.get(key);
  if (!verified || verified.expiresAt < Date.now()) {
    return false;
  }
  userOtpVerifiedCache.delete(key);
  return true;
}

function consumeEmailOtpVerified(email, purpose) {
  const key = makeEmailOtpKey(email, purpose);
  const verified = emailOtpVerifiedCache.get(key);
  if (!verified || verified.expiresAt < Date.now()) {
    return false;
  }
  emailOtpVerifiedCache.delete(key);
  return true;
}

export const login = async (req, res) => {
  try {
    requireJwtSecret();
    const { identifier, password } = req.body;

    console.log("[LOGIN] Request:", {
      identifier,
      passwordLength: password?.length,
    });

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email/số điện thoại và mật khẩu." });
    }

    // Tìm user bằng email hoặc phone
    console.log("[LOGIN] User collection:", User.collection.name);
    console.log("[LOGIN] Query:", {
      $or: [
        { email: identifier.toLowerCase().trim() },
        { phone: identifier.trim() },
      ],
    });

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { phone: identifier.trim() },
      ],
    });

    console.log(
      "[LOGIN] User found:",
      user ? { email: user.email, role: user.role } : null,
    );

    if (!user) {
      return res
        .status(401)
        .json({ message: "Email/số điện thoại hoặc mật khẩu không đúng." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("[LOGIN] Password match:", isMatch);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email/số điện thoại hoặc mật khẩu không đúng." });
    }

    // Kiểm tra tài khoản có bị khóa không
    const status = (user.membershipStatus || "").toLowerCase();
    if (status === "suspended") {
      return res.status(403).json({
        message:
          "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
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

// POST /api/auth/register

export const register = async (req, res) => {
  try {
    requireJwtSecret();
    const { fullName, email, phone, passwordHash } = req.body;
    const role = "customer";

    // Validate required fields
    if (!email || !passwordHash) {
      return res
        .status(400)
        .json({ message: "Email và mật khẩu là bắt buộc." });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email không đúng định dạng." });
    }

    if (passwordHash.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!consumeEmailOtpVerified(normalizedEmail, OTP_PURPOSE.REGISTER)) {
      return res.status(403).json({
        message: "Vui lòng xác thực OTP email trước khi đăng ký.",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email này đã được đăng ký." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordHash, 10);

    // Create new user
    const newUser = new User({
      fullName: fullName?.trim() || "Người dùng mới",
      email: normalizedEmail,
      phone: phone?.trim() || null,
      passwordHash: hashedPassword,
      role,
      membershipStatus: "Active",
    });

    await newUser.save();

    await sendWelcomeEmail({
      to: newUser.email,
      fullName: newUser.fullName,
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "Đăng ký thành công!",
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        membershipStatus: newUser.membershipStatus,
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
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
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
      return res
        .status(400)
        .json({ message: "Họ tên và email không được để trống." });
    }
    const emailLower = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return res.status(400).json({ message: "Email không đúng định dạng." });
    }
    const currentUser = await User.findById(req.user.id).lean();
    if (!currentUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    if (
      emailLower !== String(currentUser.email || "").toLowerCase() &&
      !ensureOtpVerified(req.user.id, OTP_PURPOSE.UPDATE_PROFILE)
    ) {
      return res.status(403).json({
        message: "Vui lòng xác thực OTP trước khi thay đổi email.",
      });
    }
    const existing = await User.findOne({
      email: emailLower,
      _id: { $ne: req.user.id },
    }).lean();
    if (existing)
      return res
        .status(409)
        .json({ message: "Email đã được sử dụng bởi tài khoản khác." });
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      {
        fullName: fullName.trim(),
        email: emailLower,
        phone: phone?.trim() || "",
      },
      { new: true },
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
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin." });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp." });
    }
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch)
      return res.status(401).json({ message: "Mật khẩu hiện tại không đúng." });
    const hash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user.id, { passwordHash: hash });
    res.json({ message: "Đổi mật khẩu thành công." });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server." });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { purpose } = req.body;
    const normalizedPurpose = String(purpose || "")
      .trim()
      .toUpperCase();

    if (!AUTHENTICATED_OTP_PURPOSES.includes(normalizedPurpose)) {
      return res.status(400).json({ message: "purpose không hợp lệ." });
    }

    const user = await User.findById(req.user.id).lean();
    if (!user?.email) {
      return res
        .status(400)
        .json({ message: "Tài khoản chưa có email để gửi OTP." });
    }

    const otpCode = generateOtpCode();
    const key = makeOtpKey(req.user.id, normalizedPurpose);

    userOtpCache.set(key, {
      code: otpCode,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    await sendOtpEmail({
      to: user.email,
      otpCode,
      purpose: normalizedPurpose,
    });

    return res.json({
      message: "Đã gửi OTP qua email.",
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi gửi OTP." });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { purpose, otp } = req.body;
    const normalizedPurpose = String(purpose || "")
      .trim()
      .toUpperCase();
    const code = String(otp || "").trim();

    if (!AUTHENTICATED_OTP_PURPOSES.includes(normalizedPurpose)) {
      return res.status(400).json({ message: "purpose không hợp lệ." });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: "OTP không hợp lệ." });
    }

    const key = makeOtpKey(req.user.id, normalizedPurpose);
    const current = userOtpCache.get(key);
    if (!current || current.expiresAt < Date.now()) {
      userOtpCache.delete(key);
      return res
        .status(400)
        .json({ message: "OTP đã hết hạn hoặc chưa được tạo." });
    }

    if (current.code !== code) {
      return res.status(400).json({ message: "OTP không chính xác." });
    }

    userOtpCache.delete(key);
    userOtpVerifiedCache.set(key, {
      expiresAt: Date.now() + OTP_SESSION_TTL_MS,
    });

    return res.json({
      message: "Xác thực OTP thành công.",
      validForSeconds: Math.floor(OTP_SESSION_TTL_MS / 1000),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi xác thực OTP." });
  }
};

export const sendRegisterOtp = async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email không đúng định dạng." });
    }

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(409).json({ message: "Email này đã được đăng ký." });
    }

    const otpCode = generateOtpCode();
    const key = makeEmailOtpKey(email, OTP_PURPOSE.REGISTER);
    emailOtpCache.set(key, {
      code: otpCode,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    await sendOtpEmail({
      to: email,
      otpCode,
      purpose: OTP_PURPOSE.REGISTER,
    });

    return res.json({
      message: "Đã gửi OTP đăng ký qua email.",
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi gửi OTP đăng ký." });
  }
};

export const verifyRegisterOtp = async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const code = String(req.body?.otp || "").trim();

    if (!email || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: "Thông tin OTP không hợp lệ." });
    }

    const key = makeEmailOtpKey(email, OTP_PURPOSE.REGISTER);
    const current = emailOtpCache.get(key);
    if (!current || current.expiresAt < Date.now()) {
      emailOtpCache.delete(key);
      return res
        .status(400)
        .json({ message: "OTP đã hết hạn hoặc chưa được tạo." });
    }
    if (current.code !== code) {
      return res.status(400).json({ message: "OTP không chính xác." });
    }

    emailOtpCache.delete(key);
    emailOtpVerifiedCache.set(key, {
      expiresAt: Date.now() + OTP_SESSION_TTL_MS,
    });

    return res.json({
      message: "Xác thực OTP đăng ký thành công.",
      validForSeconds: Math.floor(OTP_SESSION_TTL_MS / 1000),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi xác thực OTP đăng ký." });
  }
};

export const sendForgotPasswordOtp = async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email không đúng định dạng." });
    }

    const user = await User.findOne({ email }).lean();
    if (user) {
      const otpCode = generateOtpCode();
      const key = makeEmailOtpKey(email, OTP_PURPOSE.FORGOT_PASSWORD);
      emailOtpCache.set(key, {
        code: otpCode,
        expiresAt: Date.now() + OTP_TTL_MS,
      });

      await sendOtpEmail({
        to: email,
        otpCode,
        purpose: OTP_PURPOSE.FORGOT_PASSWORD,
      });
    }

    return res.json({
      message: "Nếu email tồn tại, hệ thống đã gửi mã OTP đặt lại mật khẩu.",
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi gửi OTP quên mật khẩu." });
  }
};

export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const code = String(req.body?.otp || "").trim();

    if (!email || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: "Thông tin OTP không hợp lệ." });
    }

    const key = makeEmailOtpKey(email, OTP_PURPOSE.FORGOT_PASSWORD);
    const current = emailOtpCache.get(key);
    if (!current || current.expiresAt < Date.now()) {
      emailOtpCache.delete(key);
      return res
        .status(400)
        .json({ message: "OTP đã hết hạn hoặc chưa được tạo." });
    }
    if (current.code !== code) {
      return res.status(400).json({ message: "OTP không chính xác." });
    }

    emailOtpCache.delete(key);
    emailOtpVerifiedCache.set(key, {
      expiresAt: Date.now() + OTP_SESSION_TTL_MS,
    });

    return res.json({
      message: "Xác thực OTP quên mật khẩu thành công.",
      validForSeconds: Math.floor(OTP_SESSION_TTL_MS / 1000),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi xác thực OTP quên mật khẩu." });
  }
};

export const resetForgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const newPassword = String(req.body?.newPassword || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!email || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin." });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp." });
    }
    if (!consumeEmailOtpVerified(email, OTP_PURPOSE.FORGOT_PASSWORD)) {
      return res.status(403).json({
        message:
          "Vui lòng xác thực OTP quên mật khẩu trước khi đặt lại mật khẩu.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản với email này." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Đặt lại mật khẩu thành công." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi đặt lại mật khẩu." });
  }
};

// GET /api/tables  (public)
