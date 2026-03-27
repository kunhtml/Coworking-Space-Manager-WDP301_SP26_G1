import Booking from "../models/booking.js";
import Table from "../models/table.js";
import User from "../models/user.js";
import Invoice from "../models/invoice.js";
import Payment from "../models/payment.js";
import {
  getVietnamDateRange,
  parseVietnamDateTime,
} from "../utils/timezone.js";

const normalizeBookingStatus = (status) => {
  return String(status || "").trim();
};

const parseDateTimeInput = (dateValue, timeValue) => {
  if (!timeValue && !dateValue) return null;

  const timeText = String(timeValue || "").trim();
  const dateText = String(dateValue || "").trim();
  return parseVietnamDateTime(dateText, timeText);
};

export const createBooking = async (req, res) => {
  try {
    const {
      tableSourceId,
      tableId,
      guestName,
      guestPhone,
      arrivalDate,
      arrivalTime,
      duration,
      pricePerHour,
      date,
      startTime: requestStartTime,
      endTime: requestEndTime,
    } = req.body;

    const bookingTableId = tableSourceId || tableId;
    const bookingDate = date || arrivalDate;
    const bookingStartTime = requestStartTime || arrivalTime;
    const bookingEndTime = requestEndTime;
    let bookingDuration = Number(duration);

    const startTime = parseDateTimeInput(bookingDate, bookingStartTime);
    const endTimeFromPayload = parseDateTimeInput(bookingDate, bookingEndTime);

    if (
      (!bookingDuration || bookingDuration <= 0) &&
      startTime &&
      endTimeFromPayload
    ) {
      const diffHours =
        (endTimeFromPayload.getTime() - startTime.getTime()) / 3600000;
      if (isFinite(diffHours) && diffHours > 0) {
        bookingDuration = diffHours;
      }
    }

    if (
      !bookingTableId ||
      !startTime ||
      !bookingDuration ||
      bookingDuration <= 0
    ) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp đủ thông tin đặt bàn." });
    }

    const now = new Date();
    if (startTime.getTime() <= now.getTime()) {
      return res.status(400).json({
        message: "Không thể đặt bàn vào thời gian quá khứ.",
      });
    }

    const endTime = new Date(startTime.getTime() + bookingDuration * 3600000);
    const table = await Table.findById(bookingTableId).lean();
    if (!table) {
      return res.status(404).json({ message: "Không tìm thấy bàn." });
    }
    if (String(table.status || "") === "Maintenance") {
      return res.status(400).json({
        message: "Bàn đang bảo trì, vui lòng chọn bàn khác.",
      });
    }

    const overlapping = await Booking.find({
      tableId: bookingTableId,
      status: { $nin: ["Cancelled", "Canceled", "Completed"] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    }).lean();

    if (overlapping.length > 0) {
      return res.status(409).json({
        message: "Khung giờ này đã có người đặt. Vui lòng chọn giờ khác.",
      });
    }

    const depositAmount = Math.round(
      Number(pricePerHour ?? table.pricePerHour ?? 0) * bookingDuration,
    );

    const count = await Booking.countDocuments();
    const bookingCode = `BK-${String(count + 1).padStart(4, "0")}`;

    const booking = await Booking.create({
      bookingCode,
      userId: req.user.id,
      tableId: bookingTableId,
      startTime,
      endTime,
      status: "Pending",
      depositAmount,
      guestInfo: guestName ? { name: guestName, phone: guestPhone } : undefined,
    });

    await Invoice.create({
      bookingId: booking._id,
      totalAmount: Math.round(Number(depositAmount || 0)),
      remainingAmount: Math.round(Number(depositAmount || 0)),
      status: Number(depositAmount || 0) > 0 ? "Pending" : "Paid",
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
        status: normalizeBookingStatus(b.status || "Pending"),
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
    const {
      guestName,
      guestPhone,
      arrivalDate,
      arrivalTime,
      date,
      startTime,
      endTime,
      duration,
    } = req.body;

    const booking = await Booking.findById(id);
    if (!booking || booking.userId?.toString() !== req.user.id) {
      return res.status(404).json({ message: "Không tìm thấy booking." });
    }

    if (["Confirmed", "Cancelled", "Canceled"].includes(booking.status)) {
      return res.status(400).json({
        message: "Booking đã xác nhận hoặc đã hủy, không thể chỉnh sửa.",
      });
    }

    const nextDate = date || arrivalDate;
    const nextStartRaw = startTime || arrivalTime;
    const nextEndRaw = endTime;

    const nextStart = parseDateTimeInput(nextDate, nextStartRaw);
    const nextEndFromPayload = parseDateTimeInput(nextDate, nextEndRaw);

    let effectiveDuration = Number(duration);
    if (
      (!effectiveDuration || effectiveDuration <= 0) &&
      nextStart &&
      nextEndFromPayload
    ) {
      const diffHours = (nextEndFromPayload.getTime() - nextStart.getTime()) / 3600000;
      if (isFinite(diffHours) && diffHours > 0) {
        effectiveDuration = diffHours;
      }
    }

    if (!nextStart || !effectiveDuration || effectiveDuration <= 0) {
      return res
        .status(400)
        .json({ message: "Thông tin ngày giờ hoặc thời lượng không hợp lệ." });
    }

    const now = new Date();
    if (nextStart.getTime() <= now.getTime()) {
      return res.status(400).json({
        message: "Không thể đặt bàn vào thời gian quá khứ.",
      });
    }

    const nextEnd = new Date(nextStart.getTime() + effectiveDuration * 3600000);
    const oldDepositAmount = Math.round(Number(booking.depositAmount || 0));

    const overlapping = await Booking.find({
      _id: { $ne: booking._id },
      tableId: booking.tableId,
      status: { $nin: ["Cancelled", "Canceled", "Completed"] },
      startTime: { $lt: nextEnd },
      endTime: { $gt: nextStart },
    }).lean();

    if (overlapping.length > 0) {
      return res.status(409).json({
        message: "Khung giờ này đã có người đặt. Vui lòng chọn giờ khác.",
      });
    }

    const table = booking.tableId ? await Table.findById(booking.tableId).lean() : null;
    const nextDepositAmount = Math.round(
      Number(table?.pricePerHour || 0) * effectiveDuration,
    );

    booking.startTime = nextStart;
    booking.endTime = nextEnd;
    booking.depositAmount = nextDepositAmount;
    booking.guestInfo = {
      ...(booking.guestInfo || {}),
      name: guestName || booking.guestInfo?.name || "",
      phone: guestPhone || booking.guestInfo?.phone || "",
    };
    await booking.save();

    const invoice = await Invoice.findOne({ bookingId: booking._id });
    if (invoice) {
      const totalDiff = nextDepositAmount - oldDepositAmount;
      const successPayments = await Payment.find({
        invoiceId: invoice._id,
        paymentStatus: "Success",
      }).lean();
      const totalPaid = successPayments.reduce(
        (sum, payment) => sum + Math.round(Number(payment.amount || 0)),
        0,
      );

      invoice.totalAmount = Math.max(
        0,
        Math.round(Number(invoice.totalAmount || 0) + totalDiff),
      );
      invoice.remainingAmount = Math.max(0, invoice.totalAmount - totalPaid);
      invoice.status =
        invoice.remainingAmount <= 0
          ? "Paid"
          : totalPaid > 0
            ? "Partially_Paid"
            : "Pending";
      await invoice.save();
    }

    res.json({ message: "Cập nhật booking thành công." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// GET /api/orders/my  (Customer)

export const getAllBookings = async (req, res) => {
  try {
    const { date, search } = req.query;
    let filter = {};

    // Filter by date (startTime falls within that day in Vietnam timezone)
    if (date) {
      const range = getVietnamDateRange(date);
      if (!range) {
        return res.status(400).json({ message: "Ngày lọc không hợp lệ." });
      }
      filter.startTime = { $gte: range.from, $lte: range.to };
    }

    // Auto-cancel expired bookings (endTime already passed but still not checked-in)
    const now = new Date();
    await Booking.updateMany(
      {
        endTime: { $lt: now },
        status: { $in: ["Pending", "Awaiting_Payment", "Confirmed"] },
      },
      { $set: { status: "Cancelled" } },
    );

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
        tableStatus: table?.status || "Unknown",
        customerName: b.guestInfo?.name || user?.fullName || "Không xác định",
        customerPhone: b.guestInfo?.phone || user?.phone || "",
        startTime: b.startTime,
        endTime: b.endTime,
        depositAmount: b.depositAmount || 0,
        status: normalizeBookingStatus(b.status || "Pending"),
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

    // Auto-cancel if booking time has already passed
    const now = new Date();
    if (booking.endTime && new Date(booking.endTime) < now) {
      booking.status = "Cancelled";
      await booking.save();
      return res.status(400).json({
        message: "Khung giờ đã trôi qua, booking đã được tự động hủy.",
      });
    }

    if (!["Confirmed", "Awaiting_Payment"].includes(booking.status)) {
      return res.status(400).json({
        message: `Chỉ có thể check-in booking đã xác nhận/chờ thanh toán (trạng thái hiện tại: ${booking.status}).`,
      });
    }
    booking.status = "CheckedIn";
    await booking.save();

    if (booking.tableId) {
      await Table.findByIdAndUpdate(booking.tableId, { status: "Occupied" });
    }

    res.json({
      message: "Check-in thành công.",
      status: "CheckedIn",
      tableStatus: booking.tableId ? "Occupied" : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// GET /api/staff/dashboard/tables  (Staff / Admin)
