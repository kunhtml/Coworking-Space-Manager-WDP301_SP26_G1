import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Booking from "../models/booking.js";
import Order from "../models/order.js";
import OrderItem from "../models/order_item.js";
import Invoice from "../models/invoice.js";
import Payment from "../models/payment.js";
import Table from "../models/table.js";
import TableType from "../models/tableType.js";
import MenuItem from "../models/menu_item.js";
import Category from "../models/category.js";
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
    const { fullName, email, phone, passwordHash, role, membershipStatus } = req.body;

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
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Email này đã được đăng ký." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordHash, 10);

    // Create new user
    const newUser = new User({
      fullName: fullName?.trim() || "Người dùng mới",
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      passwordHash: hashedPassword,
      role: role || "customer",
      membershipStatus: membershipStatus || "active",
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || "nexus_secret",
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
      })),
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
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp ngày, giờ và thời gian sử dụng." });
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
      overlapping.map((b) => b.tableId?.toString()).filter(Boolean),
    );

    const tables = await Table.find({ status: { $ne: "Maintenance" } })
      .sort({ name: 1 })
      .lean();
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
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// POST /api/tables (Staff/Admin - create table)
export const createTable = async (req, res) => {
  try {
    const { name, tableType, capacity, status, pricePerHour, pricePerDay } =
      req.body;
    if (!name || !tableType || !capacity) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp tên, loại và sức chứa." });
    }
    const table = await Table.create({
      name,
      tableType,
      capacity,
      status: status || "Available",
      pricePerHour: pricePerHour || 0,
      pricePerDay: pricePerDay || 0,
    });
    res.status(201).json({ message: "Thêm bàn thành công!", table });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tạo bàn." });
  }
};

// PUT /api/tables/:id (Staff/Admin - update table)
export const updateTable = async (req, res) => {
  try {
    const { name, tableType, capacity, status, pricePerHour, pricePerDay } =
      req.body;
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { name, tableType, capacity, status, pricePerHour, pricePerDay },
      { new: true, runValidators: true },
    );
    if (!table) return res.status(404).json({ message: "Không tìm thấy bàn." });
    res.json({ message: "Cập nhật bàn thành công!", table });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật bàn." });
  }
};

// DELETE /api/tables/:id (Staff/Admin - delete table)
export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ message: "Không tìm thấy bàn." });
    res.json({ message: "Xóa bàn thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa bàn." });
  }
};

// GET /api/table-types (public)
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
      return res.status(400).json({ message: "Tên loại bàn không được để trống." });
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
      return res.status(400).json({ message: "Tên loại bàn không được để trống." });
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
      { new: true, runValidators: true }
    );
    if (!tableType) return res.status(404).json({ message: "Không tìm thấy loại bàn." });
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
    if (!tableType) return res.status(404).json({ message: "Không tìm thấy loại bàn." });
    res.json({ message: "Xóa loại bàn thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa loại bàn." });
  }
};

// GET /api/reports/analytics (Staff/Admin)
export const getReportAnalytics = async (req, res) => {
  try {
    const { timeFilter = "Ngày" } = req.query;
    console.log("📊 Analytics request with timeFilter:", timeFilter);

    const [payments, bookings, tables, orders, invoices] = await Promise.all([
      Payment.find().sort({ paidAt: -1, createdAt: -1 }).lean(),
      Booking.find()
        .populate("tableId", "name tableType capacity status")
        .sort({ createdAt: -1 })
        .lean(),
      Table.find().sort({ name: 1 }).lean(),
      Order.find().sort({ createdAt: -1 }).lean(),
      Invoice.find().sort({ createdAt: -1 }).lean(),
    ]);

    const now = new Date();
    let revenueData = [];
    let periodLabel = "";

    // 🎯 Generate different time periods based on filter
    if (timeFilter === "Ngày") {
      periodLabel = "ngày";
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
        revenueData.push({ _id: key, total: 0, count: 0 });
      }
    } else if (timeFilter === "Tuần") {
      periodLabel = "tuần";
      // Last 8 weeks
      for (let i = 7; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i * 7);
        const weekStart = new Date(
          date.setDate(date.getDate() - date.getDay()),
        );
        const key = `T${Math.ceil(weekStart.getDate() / 7)}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
        revenueData.push({ _id: key, total: 0, count: 0 });
      }
    } else if (timeFilter === "Tháng") {
      periodLabel = "tháng";
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
        revenueData.push({ _id: key, total: 0, count: 0 });
      }
    } else if (timeFilter === "Năm") {
      periodLabel = "năm";
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        revenueData.push({ _id: String(year), total: 0, count: 0 });
      }
    }

    // 💰 Aggregate payment data based on time filter
    const successfulPayments = payments.filter(
      (p) => p.paymentStatus === "Success",
    );
    const totalRevenue = successfulPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    );
    const depositRevenue = successfulPayments
      .filter((p) => p.type === "Deposit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const otherRevenue = totalRevenue - depositRevenue;

    // Group payments by time period
    successfulPayments.forEach((payment) => {
      const paidDate = new Date(payment.paidAt || payment.createdAt || now);
      let periodKey = "";

      if (timeFilter === "Ngày") {
        periodKey = `${String(paidDate.getDate()).padStart(2, "0")}/${String(paidDate.getMonth() + 1).padStart(2, "0")}`;
      } else if (timeFilter === "Tuần") {
        const weekStart = new Date(
          paidDate.setDate(paidDate.getDate() - paidDate.getDay()),
        );
        periodKey = `T${Math.ceil(weekStart.getDate() / 7)}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
      } else if (timeFilter === "Tháng") {
        periodKey = `${String(paidDate.getMonth() + 1).padStart(2, "0")}/${paidDate.getFullYear()}`;
      } else if (timeFilter === "Năm") {
        periodKey = String(paidDate.getFullYear());
      }

      const period = revenueData.find((p) => p._id === periodKey);
      if (period) {
        period.total += Number(payment.amount) || 0;
        period.count += 1;
      }
    });

    // 📊 Generate occupancy data by time period
    let occupancyData = [];

    // Initialize occupancy periods with same structure as revenueData
    if (timeFilter === "Ngày") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
        occupancyData.push({ _id: key, occupancyRate: 0, bookingCount: 0 });
      }
    } else if (timeFilter === "Tuần") {
      for (let i = 7; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i * 7);
        const weekStart = new Date(
          date.setDate(date.getDate() - date.getDay()),
        );
        const key = `T${Math.ceil(weekStart.getDate() / 7)}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
        occupancyData.push({ _id: key, occupancyRate: 0, bookingCount: 0 });
      }
    } else if (timeFilter === "Tháng") {
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
        occupancyData.push({ _id: key, occupancyRate: 0, bookingCount: 0 });
      }
    } else if (timeFilter === "Năm") {
      // 🎯 Only show current year, not historical years without data
      const currentYear = now.getFullYear();
      occupancyData.push({
        _id: String(currentYear),
        occupancyRate: 0,
        bookingCount: 0,
      });

      // Only add previous years if there are actual bookings in those years
      const yearsWithBookings = new Set();
      bookings.forEach((booking) => {
        if (booking.startTime) {
          const bookingYear = new Date(booking.startTime).getFullYear();
          if (bookingYear < currentYear && bookingYear >= currentYear - 4) {
            yearsWithBookings.add(bookingYear);
          }
        }
      });

      // Add years with actual bookings, sorted
      Array.from(yearsWithBookings)
        .sort((a, b) => a - b)
        .forEach((year) => {
          if (!occupancyData.find((d) => d._id === String(year))) {
            occupancyData.unshift({
              _id: String(year),
              occupancyRate: 0,
              bookingCount: 0,
            });
          }
        });
    }

    // Calculate occupancy rates based on bookings
    const totalCapacity = tables.reduce(
      (sum, table) => sum + (table.capacity || 0),
      0,
    );

    bookings.forEach((booking) => {
      if (!booking.startTime) return;

      const bookingDate = new Date(booking.startTime);
      let periodKey = "";

      if (timeFilter === "Ngày") {
        periodKey = `${String(bookingDate.getDate()).padStart(2, "0")}/${String(bookingDate.getMonth() + 1).padStart(2, "0")}`;
      } else if (timeFilter === "Tuần") {
        const weekStart = new Date(
          bookingDate.setDate(bookingDate.getDate() - bookingDate.getDay()),
        );
        periodKey = `T${Math.ceil(weekStart.getDate() / 7)}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
      } else if (timeFilter === "Tháng") {
        periodKey = `${String(bookingDate.getMonth() + 1).padStart(2, "0")}/${bookingDate.getFullYear()}`;
      } else if (timeFilter === "Năm") {
        periodKey = String(bookingDate.getFullYear());
      }

      const period = occupancyData.find((p) => p._id === periodKey);
      if (period) {
        period.bookingCount += 1;
        // Calculate occupancy as percentage of table capacity usage
        const tableCapacity = booking.tableId?.capacity || 1;
        period.occupancyRate += (tableCapacity / totalCapacity) * 100;
      }
    });

    // Normalize occupancy rates (ensure reasonable percentages)
    occupancyData.forEach((period) => {
      if (period.bookingCount > 0) {
        // Cap at 100% and ensure minimum realistic rates
        period.occupancyRate = Math.min(
          100,
          Math.max(1, Math.round(period.occupancyRate)),
        );
      } else {
        // No bookings = 0% occupancy (no fake data)
        period.occupancyRate = 0;
      }
    });

    const bookingsByStatusMap = bookings.reduce((acc, booking) => {
      const status = booking.status || "Unknown";
      acc.set(status, (acc.get(status) || 0) + 1);
      return acc;
    }, new Map());

    const occupancyByStatusMap = tables.reduce((acc, table) => {
      const status = table.status || "Unknown";
      acc.set(status, (acc.get(status) || 0) + 1);
      return acc;
    }, new Map());

    const tableTypeUsageMap = bookings.reduce((acc, booking) => {
      const type = booking.tableId?.tableType || "Unknown";
      const existing = acc.get(type) || {
        tableType: type,
        bookings: 0,
        guests: 0,
      };
      existing.bookings += 1;
      existing.guests += Number(booking.tableId?.capacity) || 0;
      acc.set(type, existing);
      return acc;
    }, new Map());

    const totalTables = tables.length;
    const occupiedTables = occupancyByStatusMap.get("Occupied") || 0;
    const availableTables = occupancyByStatusMap.get("Available") || 0;
    const maintenanceTables = occupancyByStatusMap.get("Maintenance") || 0;
    const activeBookings = bookings.filter(
      (booking) => booking.status === "In_Use",
    ).length;

    res.json({
      generatedAt: now,
      timeFilter,
      periodLabel,
      summary: {
        totalRevenue,
        depositRevenue,
        otherRevenue,
        totalBookings: bookings.length,
        activeBookings,
        totalTables,
        availableTables,
        occupiedTables,
        maintenanceTables,
        occupancyRate: totalTables
          ? Math.round((occupiedTables / totalTables) * 100)
          : 0,
        totalOrders: orders.length,
        totalOrderRevenue: orders.reduce(
          (sum, order) => sum + (Number(order.totalAmount) || 0),
          0,
        ),
        totalInvoices: invoices.length,
        invoicedRevenue: invoices.reduce(
          (sum, invoice) => sum + (Number(invoice.totalAmount) || 0),
          0,
        ),
      },
      revenueByMonth: revenueData, // 🎯 Dynamic time periods
      occupancyByPeriod: occupancyData, // 📊 Dynamic occupancy data
      bookingsByStatus: Array.from(bookingsByStatusMap.entries()).map(
        ([status, count]) => ({ status, count }),
      ),
      occupancyByStatus: Array.from(occupancyByStatusMap.entries()).map(
        ([status, count]) => ({ status, count }),
      ),
      tableTypeUsage: Array.from(tableTypeUsageMap.values()).sort(
        (a, b) => b.bookings - a.bookings,
      ),
      recentPayments: successfulPayments.slice(0, 5).map((payment) => ({
        id: payment._id,
        amount: payment.amount || 0,
        type: payment.type || "Payment",
        method: payment.paymentMethod || "N/A",
        paidAt: payment.paidAt || payment.createdAt || null,
      })),
      recentBookings: bookings.slice(0, 5).map((booking) => ({
        id: booking._id,
        bookingCode: booking.bookingCode,
        tableName: booking.tableId?.name || "N/A",
        tableType: booking.tableId?.tableType || "N/A",
        status: booking.status || "Unknown",
        startTime: booking.startTime,
        depositAmount: booking.depositAmount || 0,
      })),
    });
  } catch (err) {
    console.error("❌ Analytics error:", err);
    res.status(500).json({ message: "Lỗi khi tải báo cáo tổng quan." });
  }
};

// POST /api/bookings  (Customer - create booking)
export const createBooking = async (req, res) => {
  try {
    const {
      tableSourceId,
      guestName,
      guestPhone,
      arrivalDate,
      arrivalTime,
      duration,
      pricePerHour,
    } = req.body;
    if (!tableSourceId || !arrivalDate || !arrivalTime || !duration) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp đủ thông tin đặt bàn." });
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
    const tableIds = [
      ...new Set(bookings.map((b) => b.tableId?.toString()).filter(Boolean)),
    ];
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

// PATCH /api/bookings/:id  (Customer - update own booking)
export const updateMyBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { guestName, guestPhone, arrivalDate, arrivalTime, duration } = req.body;

    const booking = await Booking.findById(id);
    if (!booking || booking.userId?.toString() !== req.user.id) {
      return res.status(404).json({ message: "Không tìm thấy booking." });
    }

    if (["Confirmed", "Cancelled"].includes(booking.status)) {
      return res
        .status(400)
        .json({ message: "Booking đã xác nhận hoặc đã hủy, không thể chỉnh sửa." });
    }

    const nextStart = new Date(`${arrivalDate}T${arrivalTime}:00`);
    const dur = Number(duration);
    if (!isFinite(nextStart.getTime()) || !dur || dur <= 0) {
      return res.status(400).json({ message: "Thông tin ngày giờ hoặc thời lượng không hợp lệ." });
    }
    const nextEnd = new Date(nextStart.getTime() + dur * 3600000);

    const overlapping = await Booking.find({
      _id: { $ne: booking._id },
      tableId: booking.tableId,
      status: { $nin: ["Cancelled", "Completed"] },
      startTime: { $lt: nextEnd },
      endTime: { $gt: nextStart },
    }).lean();

    if (overlapping.length > 0) {
      return res.status(409).json({ message: "Khung giờ này đã có người đặt. Vui lòng chọn giờ khác." });
    }

    booking.startTime = nextStart;
    booking.endTime = nextEnd;
    booking.guestInfo = {
      ...(booking.guestInfo || {}),
      name: guestName || booking.guestInfo?.name || "",
      phone: guestPhone || booking.guestInfo?.phone || "",
    };
    await booking.save();

    res.json({ message: "Cập nhật booking thành công." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// GET /api/orders/my  (Customer)
export const getMyOrders = async (req, res) => {
  try {
    const myBookings = await Booking.find({ userId: req.user.id }).select("_id").lean();
    const myBookingIdSet = new Set(myBookings.map((b) => b._id.toString()));

    // Keep backward compatibility for old orders that may not have userId set correctly.
    const allOrders = await Order.find({}).sort({ createdAt: -1 }).lean();
    const orders = allOrders.filter(
      (o) =>
        o.userId?.toString() === req.user.id ||
        myBookingIdSet.has(o.bookingId?.toString()),
    );

    const orderIds = orders.map((o) => o._id);
    const bookingIds = [...new Set(orders.map((o) => o.bookingId?.toString()).filter(Boolean))];

    const [items, bookings] = await Promise.all([
      OrderItem.find({ orderId: { $in: orderIds } }).lean(),
      Booking.find({ _id: { $in: bookingIds } }).lean(),
    ]);

    const menuIds = [...new Set(items.map((i) => i.menuItemId?.toString()).filter(Boolean))];
    const menuItems = await MenuItem.find({ _id: { $in: menuIds } }).lean();

    const bookingMap = new Map(bookings.map((b) => [b._id.toString(), b]));
    const menuMap = new Map(menuItems.map((m) => [m._id.toString(), m]));

    const itemMap = new Map();
    for (const i of items) {
      const key = i.orderId?.toString();
      const arr = itemMap.get(key) || [];
      const menu = menuMap.get(i.menuItemId?.toString());
      arr.push({
        id: i._id,
        menuItemId: i.menuItemId,
        menuName: menu?.name || "Món không xác định",
        quantity: Number(i.quantity || 0),
        priceAtOrder: Number(i.priceAtOrder || 0),
        note: i.note || "",
        lineTotal: Number(i.quantity || 0) * Number(i.priceAtOrder || 0),
      });
      itemMap.set(key, arr);
    }

    const rows = orders.map((o) => {
      const booking = bookingMap.get(o.bookingId?.toString());
      return {
        id: o._id,
        bookingId: o.bookingId,
        status: o.status || "Pending",
        totalAmount: Number(o.totalAmount || 0),
        createdAt: o.createdAt,
        bookingStatus: booking?.status || "Unknown",
        items: itemMap.get(o._id.toString()) || [],
      };
    });

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// POST /api/orders  (Customer)
export const createOrder = async (req, res) => {
  try {
    const { bookingId, items } = req.body;
    if (!bookingId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn booking và ít nhất 1 món." });
    }

    const booking = await Booking.findById(bookingId).lean();
    if (!booking || booking.userId?.toString() !== req.user.id) {
      return res.status(404).json({ message: "Không tìm thấy booking." });
    }
    if (booking.status === "Cancelled") {
      return res.status(400).json({ message: "Booking đã hủy, không thể tạo đơn hàng." });
    }

    const menuIds = [...new Set(items.map((i) => i.menuItemId).filter(Boolean))];
    const menus = await MenuItem.find({ _id: { $in: menuIds } }).lean();
    const menuMap = new Map(menus.map((m) => [m._id.toString(), m]));

    const normalized = [];
    for (const it of items) {
      const qty = Number(it.quantity || 0);
      if (!it.menuItemId || qty <= 0) continue;
      const menu = menuMap.get(it.menuItemId.toString());
      if (!menu) continue;
      normalized.push({
        menuItemId: menu._id,
        quantity: qty,
        note: it.note || "",
        priceAtOrder: Number(menu.price || 0),
      });
    }

    if (!normalized.length) {
      return res.status(400).json({ message: "Danh sách món không hợp lệ." });
    }

    const totalAmount = normalized.reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.priceAtOrder),
      0,
    );

    const order = await Order.create({
      userId: req.user.id,
      bookingId,
      status: "Pending",
      totalAmount,
    });

    await OrderItem.insertMany(
      normalized.map((i) => ({
        orderId: order._id,
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        note: i.note,
        priceAtOrder: i.priceAtOrder,
      })),
    );

    res.status(201).json({ message: "Tạo đơn hàng thành công.", orderId: order._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// PUT /api/orders/:id  (Customer)
export const updateMyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Vui lòng truyền danh sách món cần cập nhật." });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    const booking = order.bookingId ? await Booking.findById(order.bookingId).lean() : null;
    const isOwnerByOrder = order.userId?.toString() === req.user.id;
    const isOwnerByBooking = booking?.userId?.toString() === req.user.id;
    if (!isOwnerByOrder && !isOwnerByBooking) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    if (["Confirmed", "Cancelled"].includes(order.status)) {
      return res.status(400).json({ message: "Đơn hàng đã xác nhận hoặc đã hủy, không thể chỉnh sửa." });
    }

    const menuIds = [...new Set(items.map((i) => i.menuItemId).filter(Boolean))];
    const menus = await MenuItem.find({ _id: { $in: menuIds } }).lean();
    const menuMap = new Map(menus.map((m) => [m._id.toString(), m]));

    const normalized = [];
    for (const it of items) {
      const qty = Number(it.quantity || 0);
      if (!it.menuItemId || qty <= 0) continue;
      const menu = menuMap.get(it.menuItemId.toString());
      if (!menu) continue;
      normalized.push({
        menuItemId: menu._id,
        quantity: qty,
        note: it.note || "",
        priceAtOrder: Number(menu.price || 0),
      });
    }

    if (!normalized.length) {
      return res.status(400).json({ message: "Danh sách món không hợp lệ." });
    }

    const totalAmount = normalized.reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.priceAtOrder),
      0,
    );

    await OrderItem.deleteMany({ orderId: order._id });
    await OrderItem.insertMany(
      normalized.map((i) => ({
        orderId: order._id,
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        note: i.note,
        priceAtOrder: i.priceAtOrder,
      })),
    );

    order.totalAmount = totalAmount;
    await order.save();

    res.json({ message: "Cập nhật đơn hàng thành công." });
  } catch (err) {
    console.error(err);
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
      const to = new Date(date + "T23:59:59+07:00");
      filter.startTime = { $gte: from, $lte: to };
    }

    let bookings = await Booking.find(filter).sort({ startTime: 1 }).lean();

    // Search by booking code or guest name
    if (search) {
      const q = search.toLowerCase();
      bookings = bookings.filter(
        (b) =>
          (b.bookingCode || "").toLowerCase().includes(q) ||
          (b.guestInfo?.name || "").toLowerCase().includes(q),
      );
    }

    const tableIds = [
      ...new Set(bookings.map((b) => b.tableId?.toString()).filter(Boolean)),
    ];
    const userIds = [
      ...new Set(bookings.map((b) => b.userId?.toString()).filter(Boolean)),
    ];

    const [tables, users] = await Promise.all([
      Table.find({ _id: { $in: tableIds } }).lean(),
      User.find({ _id: { $in: userIds } }).lean(),
    ]);

    const tableMap = new Map(tables.map((t) => [t._id.toString(), t]));
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const rows = bookings.map((b) => {
      const table = tableMap.get(b.tableId?.toString());
      const user = userMap.get(b.userId?.toString());
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
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy booking." });
    if (booking.status !== "Confirmed") {
      return res
        .status(400)
        .json({
          message: `Chỉ có thể check-in booking đã xác nhận (trạng thái hiện tại: ${booking.status}).`,
        });
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
    const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "--");
    const fmtTime = (v) =>
      v
        ? new Date(v).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--";

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
              ? new Date(activePayment.payos.lastSyncedAt).toLocaleString(
                  "vi-VN",
                )
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

    const result = await createOrReusePayOSPayment({
      booking,
      buyer: user,
      origin,
    });
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
    if (!bookingId)
      return res.status(400).json({ message: "Thiếu bookingId." });
    const result = await cancelPayOSPayment(bookingId, req.user.id);
    if (result.notFound)
      return res.status(404).json({ message: "Không tìm thấy booking." });
    if (result.forbidden)
      return res.status(403).json({ message: "Không có quyền." });
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
    await syncPayOSPaymentRecord({
      orderCode: verifiedData.orderCode,
      webhookData: verifiedData,
    });
    res.json({ error: 0, message: "OK" });
  } catch (err) {
    console.error("webhook error:", err.message);
    res
      .status(400)
      .json({ error: -1, message: err.message || "Webhook không hợp lệ." });
  }
};

// ========== MENU MANAGEMENT (Admin/Staff) ==========

// GET /api/menu/items
export const getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find().populate("categoryId", "name").lean();
    res.json(items);
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

    const newItem = await MenuItem.create({
      name: name.trim(),
      categoryId: categoryId || null,
      description: description?.trim() || "",
      price: Number(price),
      stockQuantity: Number(stockQuantity) || 0,
      availabilityStatus: availabilityStatus || "Available",
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

    const updated = await MenuItem.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        categoryId: categoryId || null,
        description: description?.trim() || "",
        price: Number(price),
        stockQuantity: Number(stockQuantity) || 0,
        availabilityStatus: availabilityStatus || "Available",
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

// ==================== USER MANAGEMENT ====================

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
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
    const { fullName, email, password, phone, role, membershipStatus } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc." });
    }

    // Check if user exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "Email đã được sử dụng." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName: fullName?.trim() || "",
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone?.trim() || "",
      role: role || "Customer",
      membershipStatus: membershipStatus || "Active",
    });

    const userResponse = newUser.toObject();
    delete userResponse.passwordHash;

    res.status(201).json({ 
      message: "Tạo người dùng thành công!", 
      user: userResponse 
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
        _id: { $ne: userId }
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
    if (membershipStatus !== undefined) user.membershipStatus = membershipStatus;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    res.json({ 
      message: "Cập nhật người dùng thành công!", 
      user: userResponse 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật người dùng." });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Don't allow deleting yourself
    if (req.user && req.user._id.toString() === userId) {
      return res.status(400).json({ message: "Không thể xóa tài khoản của chính mình." });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    res.json({ message: "Xóa người dùng thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa người dùng." });
  }
};