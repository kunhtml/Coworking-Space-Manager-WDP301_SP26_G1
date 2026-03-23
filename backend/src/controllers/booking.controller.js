import Booking from "../models/booking.js";
import Table from "../models/table.js";
import User from "../models/user.js";

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

    if ((!bookingDuration || bookingDuration <= 0) && bookingEndTime && bookingStartTime && bookingDate) {
      const start = new Date(`${bookingDate}T${bookingStartTime}:00`);
      const end = new Date(`${bookingDate}T${bookingEndTime}:00`);
      const diffHours = (end.getTime() - start.getTime()) / 3600000;
      if (isFinite(diffHours) && diffHours > 0) {
        bookingDuration = diffHours;
      }
    }

    if (!bookingTableId || !bookingDate || !bookingStartTime) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp đủ thông tin đặt bàn." });
    }

    const startTime = new Date(`${bookingDate}T${bookingStartTime}:00`);
    if (!isFinite(startTime.getTime())) {
      return res.status(400).json({ message: "Ngày hoặc giờ không hợp lệ." });
    }

    let endTime;
    if (bookingEndTime) {
      endTime = new Date(`${bookingDate}T${bookingEndTime}:00`);
      if (!isFinite(endTime.getTime()) || endTime.getTime() <= startTime.getTime()) {
        return res.status(400).json({ message: "Giờ kết thúc không hợp lệ." });
      }
      bookingDuration = (endTime.getTime() - startTime.getTime()) / 3600000;
    } else if (bookingDuration && bookingDuration > 0) {
      endTime = new Date(startTime.getTime() + bookingDuration * 3600000);
    } else {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp thời lượng hoặc giờ kết thúc hợp lệ." });
    }

    const depositAmount = (Number(pricePerHour) || 0) * bookingDuration;

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
    const {
      guestName,
      guestPhone,
      arrivalDate,
      arrivalTime,
      duration,
      date,
      startTime: requestStartTime,
      endTime: requestEndTime,
    } = req.body;

    const booking = await Booking.findById(id);
    if (!booking || booking.userId?.toString() !== req.user.id) {
      return res.status(404).json({ message: "Không tìm thấy booking." });
    }

    if (["Confirmed", "Cancelled"].includes(booking.status)) {
      return res
        .status(400)
        .json({ message: "Booking đã xác nhận hoặc đã hủy, không thể chỉnh sửa." });
    }

    const bookingDate = date || arrivalDate;
    const bookingStartTime = requestStartTime || arrivalTime;
    const bookingEndTime = requestEndTime;
    let bookingDuration = Number(duration);

    if ((!bookingDuration || bookingDuration <= 0) && bookingEndTime && bookingDate && bookingStartTime) {
      const start = new Date(`${bookingDate}T${bookingStartTime}:00`);
      const end = new Date(`${bookingDate}T${bookingEndTime}:00`);
      const diffHours = (end.getTime() - start.getTime()) / 3600000;
      if (isFinite(diffHours) && diffHours > 0) {
        bookingDuration = diffHours;
      }
    }

    if (!bookingDate || !bookingStartTime) {
      return res.status(400).json({ message: "Vui lòng cung cấp ngày và giờ bắt đầu hợp lệ." });
    }

    const nextStart = new Date(`${bookingDate}T${bookingStartTime}:00`);
    if (!isFinite(nextStart.getTime())) {
      return res.status(400).json({ message: "Thông tin ngày giờ hoặc thời lượng không hợp lệ." });
    }

    let nextEnd;
    if (bookingEndTime) {
      nextEnd = new Date(`${bookingDate}T${bookingEndTime}:00`);
      if (!isFinite(nextEnd.getTime()) || nextEnd.getTime() <= nextStart.getTime()) {
        return res.status(400).json({ message: "Giờ kết thúc không hợp lệ." });
      }
    } else if (bookingDuration && bookingDuration > 0) {
      nextEnd = new Date(nextStart.getTime() + bookingDuration * 3600000);
    } else {
      return res.status(400).json({ message: "Vui lòng cung cấp thời lượng hoặc giờ kết thúc hợp lệ." });
    }

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
        tableStatus: table?.status || "Unknown",
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
    if (!["Confirmed", "Awaiting_Payment"].includes(booking.status)) {
      return res
        .status(400)
        .json({
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
