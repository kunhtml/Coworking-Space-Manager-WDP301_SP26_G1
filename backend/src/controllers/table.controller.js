import Booking from "../models/booking.js";
import Table from "../models/table.js";
import TableType from "../models/tableType.js";
import mongoose from "mongoose";

const toObjectIdString = (value) => {
  if (!value) return "";
  return value.toString();
};

const buildTableTypeMap = async (tables = []) => {
  const typeIds = Array.from(
    new Set(tables.map((t) => toObjectIdString(t.tableTypeId)).filter(Boolean)),
  );

  if (typeIds.length === 0) return new Map();

  const types = await TableType.find({ _id: { $in: typeIds } }).lean();
  return new Map(types.map((type) => [toObjectIdString(type._id), type]));
};

const resolveCapacityFromTypeMap = (table, tableTypeMap) =>
  Number(tableTypeMap.get(toObjectIdString(table.tableTypeId))?.capacity || 0);

const resolveTableTypePayload = async ({ tableTypeId, tableType }) => {
  const normalizedId = String(tableTypeId || "").trim();
  const normalizedName = String(tableType || "").trim();

  if (normalizedId) {
    if (!mongoose.isValidObjectId(normalizedId)) {
      return { error: "Loại bàn không hợp lệ." };
    }
    const type = await TableType.findById(normalizedId).lean();
    if (!type) return { error: "Loại bàn không tồn tại." };
    return {
      tableTypeId: type._id,
    };
  }

  if (normalizedName) {
    const matchedType = await TableType.findOne({
      name: normalizedName,
    }).lean();
    return {
      tableTypeId: matchedType?._id || null,
    };
  }

  return {
    tableTypeId: null,
  };
};

export const getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ name: 1 }).lean();
    const tableTypeMap = await buildTableTypeMap(tables);

    res.json(
      tables.map((t) => ({
        _id: t._id.toString(),
        sourceId: t._id.toString(),
        name: t.name,
        tableTypeId: toObjectIdString(t.tableTypeId),
        tableType:
          tableTypeMap.get(toObjectIdString(t.tableTypeId))?.name || "",
        capacity: resolveCapacityFromTypeMap(t, tableTypeMap),
        status: t.status,
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
        isEndValid: isFinite(end.getTime()),
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
      return res.status(400).json({
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

    const tableTypeMap = await buildTableTypeMap(tables);

    if (tableType) {
      const normalizedType = String(tableType).toLowerCase();
      tables = tables.filter((t) =>
        String(tableTypeMap.get(toObjectIdString(t.tableTypeId))?.name || "")
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
        tableType: {
          sourceId: toObjectIdString(t.tableTypeId),
          name: tableTypeMap.get(toObjectIdString(t.tableTypeId))?.name || "",
        },
        capacity: resolveCapacityFromTypeMap(t, tableTypeMap),
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
      tableTypeId,
      tableType,
      status,
      pricePerHour,
      pricePerDay,
      description,
    } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Vui lòng cung cấp tên bàn." });
    }
    if (!tableTypeId && !tableType) {
      return res.status(400).json({ message: "Vui lòng chọn loại bàn." });
    }

    const tableTypePayload = await resolveTableTypePayload({
      tableTypeId,
      tableType,
    });

    if (tableTypePayload.error) {
      return res.status(400).json({ message: tableTypePayload.error });
    }

    const table = await Table.create({
      name,
      tableTypeId: tableTypePayload.tableTypeId,
      status: status || "Available",
      pricePerHour: pricePerHour || 0,
      pricePerDay: pricePerDay || 0,
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
      tableTypeId,
      tableType,
      status,
      pricePerHour,
      pricePerDay,
      description,
    } = req.body;

    const tableTypeInputProvided =
      tableTypeId !== undefined || tableType !== undefined;

    const tableTypePayload = tableTypeInputProvided
      ? await resolveTableTypePayload({ tableTypeId, tableType })
      : null;

    if (tableTypePayload?.error) {
      return res.status(400).json({ message: tableTypePayload.error });
    }

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      {
        name,
        tableTypeId: tableTypeInputProvided
          ? tableTypePayload.tableTypeId
          : undefined,
        status,
        pricePerHour,
        pricePerDay,
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
