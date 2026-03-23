import Booking from "../models/booking.js";
import Table from "../models/table.js";

export const getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ name: 1 }).lean();
    res.json(
      tables.map((t) => ({
        _id: t._id.toString(),
        sourceId: t._id.toString(),
        name: t.name,
        tableType: t.tableType,
        capacity: t.capacity,
        status: t.status,
        location: t.location || "",
        description: t.description || "",
        pricePerHour: t.pricePerHour || 0,
        pricePerDay: t.pricePerDay || 0,
      })),
    );
  } catch (err) {
    console.error("getTables error:", err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// POST /api/tables/available  (public) — find non-overlapping tables

export const getAvailableTables = async (req, res) => {
  try {
    const {
      arrivalDate,
      arrivalTime,
      duration,
      date,
      startTime: requestStartTime,
      endTime: requestEndTime,
      tableType,
    } = req.body;

    console.log("getAvailableTables request:", {
      date: date || arrivalDate,
      startTime: requestStartTime || arrivalTime,
      endTime: requestEndTime,
      duration,
      tableType,
    });

    const requestedDate = arrivalDate || date;
    const requestedStartTime = arrivalTime || requestStartTime;
    let requestedDuration = Number(duration);

    // Validate date and start time first
    if (!requestedDate) {
      return res.status(400).json({ message: "Vui lòng cung cấp ngày." });
    }
    if (!requestedStartTime) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp giờ bắt đầu." });
    }

    // Calculate duration from startTime and endTime if not provided
    if (
      (!requestedDuration ||
        !isFinite(requestedDuration) ||
        requestedDuration <= 0) &&
      requestEndTime
    ) {
      const startStr = `${requestedDate}T${requestedStartTime}:00`;
      const endStr = `${requestedDate}T${requestEndTime}:00`;
      console.log("Parsing dates:", { startStr, endStr });
      
      const start = new Date(startStr);
      const end = new Date(endStr);
      
      console.log("Parsed dates:", { 
        start: start.toString(), 
        end: end.toString(),
        startTime: start.getTime(),
        endTime: end.getTime(),
        isStartValid: isFinite(start.getTime()),
        isEndValid: isFinite(end.getTime())
      });
      
      if (!isFinite(start.getTime()) || !isFinite(end.getTime())) {
        console.error("Invalid date/time format");
        return res
          .status(400)
          .json({ message: "Định dạng ngày hoặc giờ không hợp lệ." });
      }
      const diffHours = (end.getTime() - start.getTime()) / 3600000;
      console.log("Duration calculated:", { diffHours });
      
      if (isFinite(diffHours) && diffHours > 0) {
        requestedDuration = diffHours;
      } else {
        console.error("Invalid duration:", diffHours);
      }
    }

    // Final validation for duration
    if (
      !requestedDuration ||
      !isFinite(requestedDuration) ||
      requestedDuration <= 0
    ) {
      return res
        .status(400)
        .json({
          message:
            "Vui lòng cung cấp thời gian sử dụng hợp lệ (duration hoặc endTime).",
        });
    }

    const startTime = new Date(`${requestedDate}T${requestedStartTime}:00`);
    if (!isFinite(startTime.getTime())) {
      return res.status(400).json({ message: "Ngày hoặc giờ không hợp lệ." });
    }
    const endTime = new Date(startTime.getTime() + requestedDuration * 3600000);

    // Find bookings that overlap with [startTime, endTime)
    const overlapping = await Booking.find({
      status: { $nin: ["Cancelled", "Canceled"] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    }).lean();

    const bookedIds = new Set(
      overlapping.map((b) => b.tableId?.toString()).filter(Boolean),
    );

    let tables = await Table.find({ status: { $ne: "Maintenance" } })
      .sort({ name: 1 })
      .lean();

    if (tableType) {
      const normalizedType = String(tableType).toLowerCase();
      tables = tables.filter((t) =>
        String(t.tableType || "")
          .toLowerCase()
          .includes(normalizedType),
      );
    }

    const available = tables.filter((t) => !bookedIds.has(t._id.toString()));

    res.json(
      available.map((t) => ({
        _id: t._id.toString(),
        sourceId: t._id.toString(),
        name: t.name,
        tableType: { name: t.tableType },
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
    const {
      name,
      tableType,
      capacity,
      status,
      pricePerHour,
      pricePerDay,
      location,
      description,
    } = req.body;
    if (!name || !capacity) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp tên và sức chứa." });
    }
    const table = await Table.create({
      name,
      tableType: tableType || "",
      capacity,
      status: status || "Available",
      pricePerHour: pricePerHour || 0,
      pricePerDay: pricePerDay || 0,
      location: location || "",
      description: description || "",
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
    const {
      name,
      tableType,
      capacity,
      status,
      pricePerHour,
      pricePerDay,
      location,
      description,
    } = req.body;
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      {
        name,
        tableType,
        capacity,
        status,
        pricePerHour,
        pricePerDay,
        location,
        description,
      },
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
