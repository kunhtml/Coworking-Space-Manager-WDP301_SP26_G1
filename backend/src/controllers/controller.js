import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Booking from "../models/booking.js";
import Table from "../models/table.js";
import {
  buildPaymentPageData,
  createOrReusePayOSPayment,
  cancelPayOSPayment,
  isPayOSConfigured,
  syncPayOSPaymentRecord,
  createPayOSClient,
} from "../services/payos.service.js";

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

// GET /api/tables  (public)
export const getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ name: 1 }).lean();
    res.json(
      tables.map((t) => ({
        sourceId: t._id.toString(),
        name: t.name,
        tableType: t.tableType,
        capacity: t.capacity,
        status: t.status,
        pricePerHour: t.pricePerHour || 0,
        pricePerDay: t.pricePerDay || 0,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: "Lỗi server." });
  }
};

// POST /api/tables/available  (public) — find non-overlapping tables
export const getAvailableTables = async (req, res) => {
  try {
    const { arrivalDate, arrivalTime, duration } = req.body;
    if (!arrivalDate || !arrivalTime || !duration) {
      return res.status(400).json({ message: "Vui lòng cung cấp ngày, giờ và thời gian sử dụng." });
    }
    const startTime = new Date(`${arrivalDate}T${arrivalTime}:00`);
    if (!isFinite(startTime.getTime())) {
      return res.status(400).json({ message: "Ngày hoặc giờ không hợp lệ." });
    }
    const endTime = new Date(startTime.getTime() + Number(duration) * 3600000);

    // Find bookings that overlap with [startTime, endTime)
    const overlapping = await Booking.find({
      status: { $nin: ["Cancelled", "Canceled"] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    }).lean();

    const bookedIds = new Set(
      overlapping.map((b) => b.tableId?.toString()).filter(Boolean)
    );

    const tables = await Table.find({ status: { $ne: "Maintenance" } }).sort({ name: 1 }).lean();
    const available = tables.filter((t) => !bookedIds.has(t._id.toString()));

    res.json(
      available.map((t) => ({
        sourceId: t._id.toString(),
        name: t.name,
        tableType: t.tableType,
        capacity: t.capacity,
        status: t.status,
        pricePerHour: t.pricePerHour || 0,
        pricePerDay: t.pricePerDay || 0,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// POST /api/bookings  (Customer - create booking)
export const createBooking = async (req, res) => {
  try {
    const { tableSourceId, guestName, guestPhone, arrivalDate, arrivalTime, duration, pricePerHour } = req.body;
    if (!tableSourceId || !arrivalDate || !arrivalTime || !duration) {
      return res.status(400).json({ message: "Vui lòng cung cấp đủ thông tin đặt bàn." });
    }
    const startTime = new Date(`${arrivalDate}T${arrivalTime}:00`);
    if (!isFinite(startTime.getTime())) {
      return res.status(400).json({ message: "Ngày hoặc giờ không hợp lệ." });
    }
    const endTime = new Date(startTime.getTime() + Number(duration) * 3600000);
    const depositAmount = (Number(pricePerHour) || 0) * Number(duration);

    const count = await Booking.countDocuments();
    const bookingCode = `BK-${String(count + 1).padStart(4, "0")}`;

    const booking = await Booking.create({
      bookingCode,
      userId: req.user.id,
      tableId: tableSourceId,
      startTime,
      endTime,
      status: "Pending",
      depositAmount,
      guestInfo: guestName ? { name: guestName, phone: guestPhone } : undefined,
    });

    res.status(201).json({
      message: "Đặt bàn thành công!",
      bookingId: booking._id.toString(),
      bookingCode: booking.bookingCode,
    });
  } catch (err) {
    console.error(err);
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

// ─── Payment Controllers ───────────────────────────────────────────

// GET /api/bookings/all  (Staff / Admin)
export const getAllBookings = async (req, res) => {
  try {
    const { date, search } = req.query;
    let filter = {};

    // Filter by date (startTime falls within that day in Vietnam timezone)
    if (date) {
      const from = new Date(date + "T00:00:00+07:00");
      const to   = new Date(date + "T23:59:59+07:00");
      filter.startTime = { $gte: from, $lte: to };
    }

    let bookings = await Booking.find(filter).sort({ startTime: 1 }).lean();

    // Search by booking code or guest name
    if (search) {
      const q = search.toLowerCase();
      bookings = bookings.filter(
        (b) =>
          (b.bookingCode || "").toLowerCase().includes(q) ||
          (b.guestInfo?.name || "").toLowerCase().includes(q)
      );
    }

    const tableIds = [...new Set(bookings.map((b) => b.tableId?.toString()).filter(Boolean))];
    const userIds  = [...new Set(bookings.map((b) => b.userId?.toString()).filter(Boolean))];

    const [tables, users] = await Promise.all([
      Table.find({ _id: { $in: tableIds } }).lean(),
      User.find({ _id: { $in: userIds } }).lean(),
    ]);

    const tableMap = new Map(tables.map((t) => [t._id.toString(), t]));
    const userMap  = new Map(users.map((u) => [u._id.toString(), u]));

    const rows = bookings.map((b) => {
      const table = tableMap.get(b.tableId?.toString());
      const user  = userMap.get(b.userId?.toString());
      return {
        id: b._id,
        bookingCode: b.bookingCode || b._id.toString().slice(-6).toUpperCase(),
        spaceName: table?.name || "Không xác định",
        customerName: b.guestInfo?.name || user?.fullName || "Không xác định",
        customerPhone: b.guestInfo?.phone || user?.phone || "",
        startTime: b.startTime,
        endTime: b.endTime,
        depositAmount: b.depositAmount || 0,
        status: b.status || "Pending",
        createdAt: b.createdAt,
      };
    });

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// PATCH /api/bookings/:id/checkin  (Staff / Admin)
export const checkInBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Không tìm thấy booking." });
    if (booking.status !== "Confirmed") {
      return res.status(400).json({ message: `Chỉ có thể check-in booking đã xác nhận (trạng thái hiện tại: ${booking.status}).` });
    }
    booking.status = "CheckedIn";
    await booking.save();
    res.json({ message: "Check-in thành công.", status: "CheckedIn" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server." });
  }
};

// GET /api/payments/:bookingId  — get payment page data
export const getPaymentData = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const data = await buildPaymentPageData(bookingId, req.user.id);
    if (!data) {
      return res.status(404).json({ message: "Không tìm thấy booking." });
    }
    const { snapshot, activePayment, qrCodeDataUrl, qrCodeValue } = data;
    const booking = snapshot.booking;

    const fmt = (n) => `${new Intl.NumberFormat("vi-VN").format(n)}đ`;
    const fmtDate = (v) => v ? new Date(v).toLocaleDateString("vi-VN") : "--";
    const fmtTime = (v) => v ? new Date(v).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--";

    res.json({
      payosEnabled: isPayOSConfigured(),
      booking: {
        id: booking.bookingCode || booking._id.toString(),
        mongoId: booking._id.toString(),
        date: fmtDate(booking.startTime),
        startTime: fmtTime(booking.startTime),
        endTime: fmtTime(booking.endTime),
        depositAmount: Number(booking.depositAmount || 0),
        depositFormatted: fmt(booking.depositAmount || 0),
        status: booking.status || "Pending",
      },
      invoice: {
        totalAmount: Number(snapshot.invoice?.totalAmount || 0),
        remainingAmount: snapshot.paymentUi.remainingAmount,
        remainingFormatted: fmt(snapshot.paymentUi.remainingAmount),
        status: snapshot.invoice?.status || "Pending",
      },
      payment: activePayment
        ? {
            id: activePayment._id.toString(),
            orderCode: activePayment.payos?.orderCode || null,
            amount: Number(activePayment.amount || 0),
            amountFormatted: fmt(activePayment.amount || 0),
            paymentStatus: activePayment.paymentStatus || "Pending",
            checkoutUrl: activePayment.payos?.checkoutUrl || "",
            accountName: activePayment.payos?.accountName || "",
            accountNumber: activePayment.payos?.accountNumber || "",
            bin: activePayment.payos?.bin || "",
            description: activePayment.payos?.description || "",
            expiredAt: activePayment.payos?.expiredAt || null,
            qrCodeValue,
            qrCodeDataUrl,
            lastSyncedAt: activePayment.payos?.lastSyncedAt
              ? new Date(activePayment.payos.lastSyncedAt).toLocaleString("vi-VN")
              : "--",
          }
        : null,
      ui: snapshot.paymentUi,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// POST /api/payments/create  — create PayOS payment for a booking
export const createPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: "Thiếu bookingId." });
    }
    const booking = await Booking.findById(bookingId).lean();
    if (!booking || booking.userId?.toString() !== req.user.id) {
      return res.status(404).json({ message: "Không tìm thấy booking." });
    }
    const user = await User.findById(req.user.id).lean();
    const origin = `${req.protocol}://${req.get("host")}`;

    if (!isPayOSConfigured()) {
      return res.status(400).json({ message: "PayOS chưa được cấu hình." });
    }

    const result = await createOrReusePayOSPayment({ booking, buyer: user, origin });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Lỗi tạo thanh toán." });
  }
};

// POST /api/payments/cancel  — cancel pending payment and booking
export const cancelPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "Thiếu bookingId." });
    const result = await cancelPayOSPayment(bookingId, req.user.id);
    if (result.notFound) return res.status(404).json({ message: "Không tìm thấy booking." });
    if (result.forbidden) return res.status(403).json({ message: "Không có quyền." });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Lỗi hủy thanh toán." });
  }
};

// POST /api/payos/webhook  — PayOS webhook
export const payosWebhook = async (req, res) => {
  try {
    const payOS = createPayOSClient();
    const verifiedData = payOS.webhooks.verify(req.body);
    await syncPayOSPaymentRecord({ orderCode: verifiedData.orderCode, webhookData: verifiedData });
    res.json({ error: 0, message: "OK" });
  } catch (err) {
    console.error("webhook error:", err.message);
    res.status(400).json({ error: -1, message: err.message || "Webhook không hợp lệ." });
  }
};
