import mongoose from "mongoose";
import Booking from "../models/booking.js";
import Order from "../models/order.js";
import OrderItem from "../models/order_item.js";
import Table from "../models/table.js";
import TableType from "../models/tableType.js";
import MenuItem from "../models/menu_item.js";
import User from "../models/user.js";
import Invoice from "../models/invoice.js";
import { createCounterOrderPayment } from "../services/payos.service.js";
import {
  getVietnamDateRange,
  getVietnamDateString,
  toVietnamISOString,
} from "../utils/timezone.js";

const STAFF_TABLE_STATUSES = new Set([
  "Available",
  "Occupied",
  "Reserved",
  "Maintenance",
  "Cleaning",
]);

const ACCEPTED_ORDER_STATUS_INPUTS = new Set(["PENDING", "CONFIRMED", "PREPARING", "SERVED", "COMPLETED", "CANCELLED"]);

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || ""));
}

const normalizeText = (value) => String(value || "").trim();
const normalizeEmail = (value) => normalizeText(value).toLowerCase();

function resolveMenuAvailabilityAfterStock(currentStatus, nextQty) {
  const current = String(currentStatus || "").trim().toUpperCase();
  if (current === "UNAVAILABLE") return "UNAVAILABLE";
  return Number(nextQty || 0) > 0 ? "AVAILABLE" : "OUT_OF_STOCK";
}

async function restoreOrderItemsToStock(orderId) {
  const orderItems = await OrderItem.find({ orderId }).lean();
  const qtyByMenuId = new Map();
  for (const item of orderItems) {
    const key = item.menuItemId?.toString();
    if (!key) continue;
    qtyByMenuId.set(
      key,
      Number(qtyByMenuId.get(key) || 0) + Number(item.quantity || 0),
    );
  }

  for (const [menuId, restoreQty] of qtyByMenuId.entries()) {
    const menu = await MenuItem.findById(menuId);
    if (!menu) continue;
    const currentQty = Number(menu.stockQuantity || 0);
    const nextQty = Math.max(0, currentQty + Number(restoreQty || 0));
    menu.stockQuantity = nextQty;
    menu.availabilityStatus = resolveMenuAvailabilityAfterStock(
      menu.availabilityStatus,
      nextQty,
    );
    await menu.save();
  }
}

async function findCustomerByPhoneOrEmail(keyword) {
  const q = normalizeText(keyword);
  if (!q) return null;

  const exactMatch = await User.findOne({
    $or: [{ email: normalizeEmail(q) }, { phone: q }],
  })
    .select("fullName email phone")
    .lean();
  if (exactMatch) return exactMatch;

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return User.findOne({ $or: [{ email: regex }, { phone: regex }] })
    .select("fullName email phone")
    .lean();
}

function buildOrderRows(
  orders,
  orderItems,
  menuMap,
  bookingMap,
  tableMap,
  userMap,
  invoiceMap,
) {
  const itemMap = new Map();
  for (const item of orderItems) {
    const key = item.orderId?.toString();
    const arr = itemMap.get(key) || [];
    const menu = menuMap.get(item.menuItemId?.toString());
    arr.push({
      id: item._id,
      menuItemId: item.menuItemId,
      menuName: menu?.name || item.itemName || "Mon khong xac dinh",
      quantity: Number(item.quantity || 0),
      priceAtOrder: Number(item.priceAtOrder || 0),
      note: item.note || "",
      lineTotal: Number(item.quantity || 0) * Number(item.priceAtOrder || 0),
    });
    itemMap.set(key, arr);
  }

  return orders.map((o) => {
    const orderStatus = o.status || "PENDING";
    const invoice = invoiceMap.get(o._id.toString()) || null;
    const invoiceRemaining = Number(invoice?.remainingAmount || 0);
    const invoiceStatus = invoice?.status || "Pending";
    const isPaid = invoiceStatus === "Paid" || invoiceRemaining <= 0;

    let paymentStatus = "WAITING_PAYMENT";
    if (orderStatus === "CANCELLED") {
      paymentStatus = "CANCELLED";
    } else if (isPaid) {
      paymentStatus = "PAID";
    }

    let staffStatus = "WAITING_PAYMENT";
    if (orderStatus === "CANCELLED") {
      staffStatus = "CANCELLED";
    } else if (orderStatus === "COMPLETED") {
      staffStatus = "COMPLETED";
    } else if (isPaid) {
      staffStatus = "PAID";
    }

    const booking = bookingMap.get(o.bookingId?.toString());
    const table = tableMap.get(booking?.tableId?.toString());
    const user =
      userMap.get(booking?.userId?.toString()) ||
      userMap.get(o.userId?.toString());
    const orderGuest = o.guestInfo || {};
    const orderAmount = Number(o.totalAmount || 0);
    const tableAmount = Number(booking?.depositAmount || 0);
    const combinedTotal = Number(invoice?.totalAmount ?? orderAmount + tableAmount);

    return {
      id: o._id,
      orderCode: "#" + String(o._id).slice(-6).toUpperCase(),
      bookingId: o.bookingId || null,
      bookingCode: booking?.bookingCode || "Walk-in",
      tableId: booking?.tableId || null,
      tableName: table?.name || "Khong xac dinh",
      customerName:
        booking?.guestInfo?.name ||
        orderGuest?.name ||
        user?.fullName ||
        "Khach le",
      customerPhone: booking?.guestInfo?.phone || orderGuest?.phone || user?.phone || "",
      customerEmail: booking?.guestInfo?.email || orderGuest?.email || user?.email || "",
      status: orderStatus,
      staffStatus,
      paymentStatus,
      invoiceStatus: invoice?.status || "Pending",
      remainingAmount: invoiceRemaining,
      orderAmount,
      tableAmount,
      totalAmount: combinedTotal,
      createdAt: o.createdAt,
      items: itemMap.get(o._id.toString()) || [],
    };
  });
}

export const getStaffTableStatusList = async (req, res) => {
  try {
    const { status, search, date } = req.query;
    const tableFilter = {};

    if (status && status !== "all") {
      tableFilter.status = status;
    }

    const realNow = new Date();
    const selectedDateRange = date ? getVietnamDateRange(date) : null;
    if (date && !selectedDateRange) {
      return res.status(400).json({ message: "Ngày xem lịch không hợp lệ." });
    }
    const now = selectedDateRange ? selectedDateRange.from : realNow;
    const shouldAutoSyncRealtime = !selectedDateRange;

    // Auto-cancel expired bookings (endTime passed, still not checked-in)
    if (shouldAutoSyncRealtime) {
      await Booking.updateMany(
        {
          endTime: { $lt: now },
          status: {
            $in: [
              "Pending",
              "Awaiting_Payment",
              "Confirmed",
            ],
          },
        },
        { $set: { status: "Cancelled" } },
      );
    }

    // Auto-release Occupied tables that have no active booking right now
    if (shouldAutoSyncRealtime) {
      const occupiedTables = await Table.find({ status: "Occupied" }).lean();
      if (occupiedTables.length > 0) {
        const occupiedIds = occupiedTables.map((t) => t._id);
        const stillActive = await Booking.find({
          tableId: { $in: occupiedIds },
          status: {
            $in: [
              "CheckedIn",
              "Confirmed",
              "Awaiting_Payment",
            ],
          },
          startTime: { $lte: now },
          endTime: { $gte: now },
        })
          .select("tableId")
          .lean();
        const activeSet = new Set(stillActive.map((b) => b.tableId?.toString()));
        const toRelease = occupiedIds.filter(
          (id) => !activeSet.has(id.toString()),
        );
        if (toRelease.length > 0) {
          await Table.updateMany(
            { _id: { $in: toRelease } },
            { $set: { status: "Available" } },
          );
        }
      }
    }

    let tables = await Table.find(tableFilter).sort({ name: 1 }).lean();

    const typeIds = [
      ...new Set(tables.map((t) => t.tableTypeId?.toString()).filter(Boolean)),
    ];
    const tableTypes = typeIds.length
      ? await TableType.find({ _id: { $in: typeIds } }).lean()
      : [];
    const tableTypeMap = new Map(
      tableTypes.map((type) => [type._id.toString(), type]),
    );

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      tables = tables.filter(
        (t) =>
          String(t.name || "")
            .toLowerCase()
            .includes(q) ||
          String(tableTypeMap.get(t.tableTypeId?.toString())?.name || "")
            .toLowerCase()
            .includes(q),
      );
    }

    const tableIds = tables.map((t) => t._id);
    const activeBookingFilter = {
      tableId: { $in: tableIds },
      status: {
        $in: [
          "Pending",
          "Awaiting_Payment",
          "Confirmed",
          "CheckedIn",
        ],
      },
      startTime: { $lte: now },
      endTime: { $gte: now },
    };

    const activeBookings = await Booking.find(activeBookingFilter)
      .sort({ startTime: 1 })
      .lean();

    // For a selected date, return schedule in that day. Otherwise keep near-future window.
    const nearFutureEnd = new Date(now);
    nearFutureEnd.setDate(nearFutureEnd.getDate() + 2);
    nearFutureEnd.setHours(0, 0, 0, 0);

    const scheduleStart = selectedDateRange ? selectedDateRange.from : now;
    const scheduleEnd = selectedDateRange ? selectedDateRange.to : nearFutureEnd;

    const upcomingBookings = await Booking.find({
      tableId: { $in: tableIds },
      status: {
        $in: ["Pending", "Awaiting_Payment", "Confirmed", "CheckedIn"],
      },
      endTime: { $gt: scheduleStart },
      startTime: { $lt: scheduleEnd },
    })
      .sort({ startTime: 1 })
      .lean();

    const bookingMap = new Map();
    for (const b of activeBookings) {
      const key = b.tableId?.toString();
      if (!key || bookingMap.has(key)) continue;
      bookingMap.set(key, b);
    }

    // Group upcoming bookings by tableId
    const upcomingMap = new Map();
    for (const b of upcomingBookings) {
      const key = b.tableId?.toString();
      if (!key) continue;
      if (!upcomingMap.has(key)) upcomingMap.set(key, []);
      upcomingMap.get(key).push({
        id: b._id,
        bookingCode:
          b.bookingCode || `#${String(b._id).slice(-6).toUpperCase()}`,
        status: b.status,
        startTime: b.startTime,
        endTime: b.endTime,
      });
    }

    const rows = tables.map((t) => {
      const active = bookingMap.get(t._id.toString());
      return {
        id: t._id,
        name: t.name,
        tableType: tableTypeMap.get(t.tableTypeId?.toString())?.name || "",
        capacity: Number(
          tableTypeMap.get(t.tableTypeId?.toString())?.capacity || 0,
        ),
        status: t.status || "Available",
        pricePerHour: Number(t.pricePerHour || 0),
        pricePerDay: Number(t.pricePerDay || 0),
        activeBooking: active
          ? {
              id: active._id,
              bookingCode:
                active.bookingCode ||
                `#${String(active._id).slice(-6).toUpperCase()}`,
              status: active.status || "Pending",
              startTime: active.startTime,
              endTime: active.endTime,
            }
          : null,
        upcomingBookings: upcomingMap.get(t._id.toString()) || [],
      };
    });

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// PATCH /api/staff/dashboard/tables/:id/status  (Staff / Admin)

export const updateStaffTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!STAFF_TABLE_STATUSES.has(String(status || ""))) {
      return res.status(400).json({
        message:
          "Trạng thái không hợp lệ. Cho phép: Available, Occupied, Reserved, Maintenance, Cleaning.",
      });
    }

    const table = await Table.findByIdAndUpdate(
      id,
      { status: String(status) },
      { returnDocument: "after" },
    ).lean();

    if (!table) {
      return res.status(404).json({ message: "Không tìm thấy bàn." });
    }

    res.json({
      message: "Cập nhật trạng thái bàn thành công.",
      table: {
        id: table._id,
        name: table.name,
        status: table.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// GET /api/staff/dashboard/orders  (Staff / Admin)

export const getStaffOrders = async (req, res) => {
  try {
    const { status, date, search } = req.query;
    const orderFilter = {};

    // Auto-cancel PENDING orders older than 15 minutes
    const expiryCutoff = new Date(Date.now() - 15 * 60 * 1000);
    const expiredOrders = await Order.find({
      status: "PENDING",
      createdAt: { $lt: expiryCutoff },
    }).lean();

    if (expiredOrders.length > 0) {
      const expiredIds = expiredOrders.map((o) => o._id);
      await Order.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { status: "CANCELLED" } },
      );

      // Also cancel related invoices
      await Invoice.updateMany(
        {
          orderIds: { $in: expiredIds },
          status: { $ne: "Paid" },
        },
        { $set: { status: "Cancelled", remainingAmount: 0 } },
      );

      // Release tables if no other active bookings
      const expiredBookingIds = [
        ...new Set(
          expiredOrders.map((o) => o.bookingId?.toString()).filter(Boolean),
        ),
      ];
      if (expiredBookingIds.length > 0) {
        await Booking.updateMany(
          {
            _id: { $in: expiredBookingIds },
            status: { $in: ["Pending", "Awaiting_Payment"] },
          },
          { $set: { status: "Cancelled" } },
        );
      }
    }

    if (status && status !== "all") {
      const rawStatus = String(status).trim().toUpperCase();
      if (!ACCEPTED_ORDER_STATUS_INPUTS.has(rawStatus)) {
        return res
          .status(400)
          .json({ message: "Trạng thái đơn hàng không hợp lệ." });
      }
      orderFilter.status = rawStatus;
    }

    if (date) {
      const range = getVietnamDateRange(date);
      if (!range) {
        return res.status(400).json({ message: "Ngày lọc không hợp lệ." });
      }
      orderFilter.createdAt = { $gte: range.from, $lte: range.to };
    }

    let orders = await Order.find(orderFilter).sort({ createdAt: -1 }).lean();

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      orders = orders.filter((o) =>
        String(o._id).slice(-6).toLowerCase().includes(q),
      );
    }

    const orderIds = orders.map((o) => o._id);
    const bookingIds = [
      ...new Set(orders.map((o) => o.bookingId?.toString()).filter(Boolean)),
    ];
    const userIds = [
      ...new Set(orders.map((o) => o.userId?.toString()).filter(Boolean)),
    ];

    const [orderItems, bookings, users, invoices] = await Promise.all([
      OrderItem.find({ orderId: { $in: orderIds } }).lean(),
      Booking.find({ _id: { $in: bookingIds } }).lean(),
      User.find({ _id: { $in: userIds } }).lean(),
      Invoice.find({ orderIds: { $in: orderIds } })
        .select("orderIds status remainingAmount")
        .lean(),
    ]);

    const tableIds = [
      ...new Set(bookings.map((b) => b.tableId?.toString()).filter(Boolean)),
    ];
    const menuIds = [
      ...new Set(
        orderItems.map((i) => i.menuItemId?.toString()).filter(Boolean),
      ),
    ];

    const [tables, menuItems] = await Promise.all([
      Table.find({ _id: { $in: tableIds } }).lean(),
      MenuItem.find({ _id: { $in: menuIds } }).lean(),
    ]);

    const bookingMap = new Map(bookings.map((b) => [b._id.toString(), b]));
    const tableMap = new Map(tables.map((t) => [t._id.toString(), t]));
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const menuMap = new Map(menuItems.map((m) => [m._id.toString(), m]));
    const invoiceMap = new Map();
    for (const invoice of invoices) {
      for (const orderId of invoice.orderIds || []) {
        invoiceMap.set(orderId.toString(), invoice);
      }
    }

    const rows = buildOrderRows(
      orders,
      orderItems,
      menuMap,
      bookingMap,
      tableMap,
      userMap,
      invoiceMap,
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

export const findStaffCustomer = async (req, res) => {
  try {
    const q = normalizeText(req.query.q);
    if (!q) {
      return res.status(400).json({ message: "Vui lòng nhập số điện thoại hoặc email để tìm khách." });
    }

    const user = await findCustomerByPhoneOrEmail(q);
    if (!user) {
      return res.json({ found: false, customer: null });
    }

    return res.json({
      found: true,
      customer: {
        id: user._id,
        fullName: user.fullName || "",
        phone: user.phone || "",
        email: user.email || "",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// POST /api/staff/dashboard/orders/counter  (Staff / Admin)

export const createCounterOrder = async (req, res) => {
  try {
    const {
      bookingId,
      tableId,
      items,
      customerName,
      customerPhone,
      customerEmail,
      customerQuery,
      paymentMethod,
      durationHours,
    } = req.body;

    const hasMenuItems = Array.isArray(items) && items.length > 0;
    const hasTable = tableId && isValidObjectId(tableId);

    // Must have either a table or menu items
    if (!hasTable && !hasMenuItems && !bookingId) {
      return res
        .status(400)
        .json({ message: "Vui lòng chọn bàn hoặc ít nhất 1 món." });
    }

    let booking = null;
    let customerUser = null;

    const contactToSearch = normalizeText(customerQuery || customerPhone || customerEmail);
    if (contactToSearch) {
      customerUser = await findCustomerByPhoneOrEmail(contactToSearch);
    }

    const resolvedName = normalizeText(customerName) || normalizeText(customerUser?.fullName);
    const resolvedPhone = normalizeText(customerPhone) || normalizeText(customerUser?.phone);
    const resolvedEmail = normalizeEmail(customerEmail) || normalizeEmail(customerUser?.email);

    if (bookingId) {
      // Case 1: Existing booking
      if (!isValidObjectId(bookingId)) {
        return res.status(400).json({ message: "bookingId không hợp lệ." });
      }
      booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy booking." });
      }

      const nextGuestInfo = {
        name: resolvedName || normalizeText(booking.guestInfo?.name),
        phone: resolvedPhone || normalizeText(booking.guestInfo?.phone),
        email: resolvedEmail || normalizeEmail(booking.guestInfo?.email),
      };

      if (booking.tableId && (!nextGuestInfo.name || (!nextGuestInfo.phone && !nextGuestInfo.email))) {
        return res.status(400).json({
          message: "Đơn có bàn phải có tên khách và ít nhất số điện thoại hoặc email.",
        });
      }

      booking.guestInfo = nextGuestInfo;
      await booking.save();
    } else if (hasTable) {
      // Case 2: Walk-in with table → create booking
      const table = await Table.findById(tableId).lean();
      if (!table) {
        return res.status(404).json({ message: "Không tìm thấy bàn." });
      }

      const start = new Date();
      const hrs = Math.max(1, Number(durationHours || 2));
      const end = new Date(start.getTime() + hrs * 3600000);

      // Prevent overlapping with existing bookings
      const overlapping = await Booking.findOne({
        tableId,
        status: {
          $in: ["Pending", "Awaiting_Payment", "Confirmed", "CheckedIn"],
        },
        $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
      });

      if (overlapping) {
        return res.status(400).json({
          message: `Không thể chọn ${hrs} giờ vì trùng với lịch đặt trước (từ ${new Date(overlapping.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}). Vui lòng giảm số giờ thuê.`,
        });
      }

      const bookingCode = `WALK-${Date.now().toString().slice(-6)}`;

      const pricePerHour = Number(table.pricePerHour || 0);
      if (pricePerHour === 0) {
        return res.status(400).json({
          message: "Bàn chưa có giá. Vui lòng cập nhật giá bàn trước.",
        });
      }

      if (!resolvedName || (!resolvedPhone && !resolvedEmail)) {
        return res.status(400).json({
          message: "Đơn có bàn phải có tên khách và ít nhất số điện thoại hoặc email.",
        });
      }

      const depositAmount = Math.round(pricePerHour * hrs);

      booking = await Booking.create({
        bookingCode,
        userId: customerUser?._id || undefined,
        tableId: table._id,
        startTime: start,
        endTime: end,
        status: "Awaiting_Payment",
        depositAmount,
        guestInfo: {
          name: resolvedName,
          phone: resolvedPhone,
          email: resolvedEmail,
        },
      });

      await Table.findByIdAndUpdate(table._id, { status: "Reserved" });
    }
    // Case 3: No table, no booking → menu-only order (booking stays null)

    const hasBookingTable = Boolean(booking?.tableId || hasTable);
    const effectiveGuestName = normalizeText(booking?.guestInfo?.name || resolvedName);
    const effectiveGuestPhone = normalizeText(booking?.guestInfo?.phone || resolvedPhone);
    const effectiveGuestEmail = normalizeEmail(booking?.guestInfo?.email || resolvedEmail);

    if (hasBookingTable && (!effectiveGuestName || (!effectiveGuestPhone && !effectiveGuestEmail))) {
      return res.status(400).json({
        message: "Đơn có bàn phải có tên khách và ít nhất số điện thoại hoặc email.",
      });
    }

    // Process menu items
    let validItems = [];
    let totalAmount = 0;

    if (hasMenuItems) {
      const menuIds = [
        ...new Set(items.map((i) => i.menuItemId).filter(Boolean)),
      ];
      const menus = await MenuItem.find({ _id: { $in: menuIds } }).lean();
      const menuMap = new Map(menus.map((m) => [m._id.toString(), m]));

      for (const it of items) {
        const qty = Number(it.quantity || 0);
        if (!it.menuItemId || qty <= 0) continue;
        const menu = menuMap.get(String(it.menuItemId));
        if (!menu) {
          return res.status(400).json({ message: "Có món không tồn tại trong thực đơn." });
        }
        const stock = Number(menu.stockQuantity || 0);
        const availability = String(menu.availabilityStatus || "").trim().toUpperCase();
        const isUnavailable = ["OUT_OF_STOCK", "UNAVAILABLE", "DISCONTINUED"].includes(availability);
        if (isUnavailable || stock <= 0) {
          return res.status(400).json({
            message: `Món ${menu.name || "đã chọn"} đã hết hàng, vui lòng chọn món khác.`,
          });
        }
        if (qty > stock) {
          return res.status(400).json({
            message: `Món ${menu.name || "đã chọn"} chỉ còn ${stock} phần.`,
          });
        }
        validItems.push({
          menuItemId: menu._id,
          quantity: qty,
          note: it.note || "",
          priceAtOrder: Number(menu.price || 0),
        });
      }

      if (validItems.length === 0) {
        return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 món hợp lệ." });
      }

      totalAmount = validItems.reduce(
        (sum, i) => sum + Number(i.quantity) * Number(i.priceAtOrder),
        0,
      );
    }

    const order = await Order.create({
      userId: booking?.userId || customerUser?._id || null,
      bookingId: booking?._id || null,
      guestInfo:
        effectiveGuestName || effectiveGuestPhone || effectiveGuestEmail
          ? {
              name: effectiveGuestName,
              phone: effectiveGuestPhone,
              email: effectiveGuestEmail,
            }
          : undefined,
      status: "PENDING",
      totalAmount,
    });

    if (validItems.length > 0) {
      await OrderItem.insertMany(
        validItems.map((i) => ({
          orderId: order._id,
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          note: i.note,
          priceAtOrder: i.priceAtOrder,
        })),
      );
    }

    // Create invoice
    const bookingAmount = Math.round(Number(booking?.depositAmount || 0));
    const orderAmount = Math.round(Number(order.totalAmount || 0));
    const combinedTotal = bookingAmount + orderAmount;

    const invoice = await Invoice.create({
      bookingId: booking?._id || null,
      orderIds: [order._id],
      totalAmount: combinedTotal,
      remainingAmount: combinedTotal,
      status: combinedTotal > 0 ? "Pending" : "Paid",
    });

    // Create payment link only for non-cash flows when booking exists.
    let paymentResult = null;
    let paymentWarning = null;
    const normalizedPaymentMethod = String(paymentMethod || "").trim().toUpperCase();
    const shouldCreatePayosLink = booking && normalizedPaymentMethod !== "CASH";
    if (shouldCreatePayosLink) {
      const origin =
        req.get("origin") || `http://localhost:${process.env.PORT || 5000}`;
      try {
        paymentResult = await createCounterOrderPayment({
          booking,
          order,
          invoice,
          buyer: {
            name: effectiveGuestName || "Khách lẻ",
            phone: effectiveGuestPhone || "",
            email: effectiveGuestEmail || undefined,
          },
          origin,
        });
      } catch (payErr) {
        // Keep order/invoice creation successful even when QR link generation fails.
        paymentWarning = payErr?.message || "Không thể tạo link thanh toán PayOS.";
      }
    }

    res.status(201).json({
      message: "Tạo counter order thành công.",
      bookingId: booking?._id || null,
      orderId: order._id,
      orderCode: `#${String(order._id).slice(-6).toUpperCase()}`,
      invoiceId: invoice._id,
      payment: paymentResult,
      paymentWarning,
      bookingAmount,
      orderAmount,
      totalAmount: combinedTotal,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Lỗi tạo counter order: " + err.message,
      stack: err.stack,
    });
  }
};

// PUT /api/staff/dashboard/orders/:id  (Staff / Admin)

export const updateStaffOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, items } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    const invoice = await Invoice.findOne({ orderIds: order._id });
    const invoiceRemaining = Number(invoice?.remainingAmount || 0);
    const invoiceStatus = invoice?.status || "Pending";
    const isPaid = invoiceStatus === "Paid" || invoiceRemaining <= 0;

    let touched = false;
    let didRefund = false;
    if (typeof status === "string" && status.trim()) {
      const rawStatus = status.trim().toUpperCase();
      if (!ACCEPTED_ORDER_STATUS_INPUTS.has(rawStatus)) {
        return res
          .status(400)
          .json({ message: "Trạng thái đơn hàng không hợp lệ." });
      }
      const targetStatus = rawStatus;
      if (targetStatus === "COMPLETED") {
        if (!isPaid) {
          return res.status(400).json({
            message: "Đơn chưa thanh toán, không thể xác nhận hoàn thành.",
          });
        }
      }

      if (targetStatus === "CANCELLED" && isPaid && order.status !== "CANCELLED") {
        await restoreOrderItemsToStock(order._id);
        if (invoice) {
          invoice.status = "Cancelled";
          invoice.remainingAmount = 0;
          await invoice.save();
        }
        didRefund = true;
      }

      if (targetStatus === "CANCELLED" && !isPaid && invoice) {
        invoice.status = "Cancelled";
        invoice.remainingAmount = 0;
        await invoice.save();
      }

      order.status = targetStatus;
      touched = true;
    } else {
      order.status = order.status || "PENDING";
    }

    if (Array.isArray(items)) {
      if (isPaid) {
        return res.status(400).json({
          message: "Đơn đã thanh toán, chỉ có thể hủy đơn để hoàn.",
        });
      }

      const menuIds = [
        ...new Set(items.map((i) => i.menuItemId).filter(Boolean)),
      ];
      const menus = await MenuItem.find({ _id: { $in: menuIds } }).lean();
      const menuMap = new Map(menus.map((m) => [m._id.toString(), m]));

      const validItems = [];
      for (const it of items) {
        const qty = Number(it.quantity || 0);
        if (!it.menuItemId || qty <= 0) continue;
        const menu = menuMap.get(String(it.menuItemId));
        if (!menu) continue;
        const stock = Number(menu.stockQuantity || 0);
        const availability = String(menu.availabilityStatus || "")
          .trim()
          .toUpperCase();
        const isUnavailable =
          availability === "UNAVAILABLE" ||
          availability === "OUT_OF_STOCK" ||
          availability === "DISCONTINUED";
        if (isUnavailable || stock <= 0) {
          return res.status(400).json({
            message: `Món ${menu.name || "đã chọn"} hiện không còn để thêm vào đơn.`,
          });
        }
        if (qty > stock) {
          return res.status(400).json({
            message: `Món ${menu.name || "đã chọn"} chỉ còn ${stock} phần.`,
          });
        }
        validItems.push({
          menuItemId: menu._id,
          quantity: qty,
          note: it.note || "",
          priceAtOrder: Number(menu.price || 0),
        });
      }

      if (!validItems.length) {
        return res.status(400).json({ message: "Danh sách món không hợp lệ." });
      }

      await OrderItem.deleteMany({ orderId: order._id });
      await OrderItem.insertMany(
        validItems.map((i) => ({
          orderId: order._id,
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          note: i.note,
          priceAtOrder: i.priceAtOrder,
        })),
      );

      order.totalAmount = validItems.reduce(
        (sum, i) => sum + Number(i.quantity) * Number(i.priceAtOrder),
        0,
      );
      touched = true;
    }

    if (!touched) {
      return res
        .status(400)
        .json({ message: "Không có dữ liệu hợp lệ để cập nhật." });
    }

    await order.save();

    res.json({
      message: didRefund
        ? "Đã hủy đơn và hoàn số lượng món vào kho."
        : "Cập nhật đơn hàng thành công.",
      order: {
        id: order._id,
        status: order.status,
        totalAmount: Number(order.totalAmount || 0),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

async function buildStaffInvoicePayload(orderId) {
  const order = await Order.findById(orderId).lean();
  if (!order) return null;

  const [booking, items] = await Promise.all([
    order.bookingId ? Booking.findById(order.bookingId).lean() : null,
    OrderItem.find({ orderId: order._id }).lean(),
  ]);

  const [table, user] = await Promise.all([
    booking?.tableId ? Table.findById(booking.tableId).lean() : null,
    booking?.userId ? User.findById(booking.userId).lean() : null,
  ]);

  const tableType = table?.tableTypeId
    ? await TableType.findById(table.tableTypeId).lean()
    : null;

  const menuIds = [
    ...new Set(items.map((i) => i.menuItemId?.toString()).filter(Boolean)),
  ];
  const menus = await MenuItem.find({ _id: { $in: menuIds } }).lean();
  const menuMap = new Map(menus.map((m) => [m._id.toString(), m]));

  const orderLines = items.map((i) => {
    const menu = menuMap.get(i.menuItemId?.toString());
    const quantity = Number(i.quantity || 0);
    const unitPrice = Number(i.priceAtOrder || 0);
    return {
      menuItemId: i.menuItemId,
      menuName: menu?.name || i.itemName || "Món không xác định",
      quantity,
      unitPrice,
      note: i.note || "",
      lineTotal: quantity * unitPrice,
    };
  });

  const subTotal = orderLines.reduce((sum, x) => sum + x.lineTotal, 0);
  const depositAmount = Number(booking?.depositAmount || 0);
  const totalAmount = subTotal + depositAmount;

  return {
    invoiceCode: `INV-${String(order._id).slice(-6).toUpperCase()}`,
    generatedAt: toVietnamISOString(new Date()),
    order: {
      id: order._id,
      orderCode: `#${String(order._id).slice(-6).toUpperCase()}`,
      status: order.status || "PENDING",
      createdAt: order.createdAt,
      totalAmount: Number(order.totalAmount || 0),
    },
    booking: booking
      ? {
          id: booking._id,
          bookingCode:
            booking.bookingCode ||
            `#${String(booking._id).slice(-6).toUpperCase()}`,
          status: booking.status || "Pending",
          startTime: booking.startTime,
          endTime: booking.endTime,
          depositAmount,
        }
      : null,
    customer: {
      name: booking?.guestInfo?.name || order?.guestInfo?.name || user?.fullName || "Khách lẻ",
      phone: booking?.guestInfo?.phone || order?.guestInfo?.phone || user?.phone || "",
      email: booking?.guestInfo?.email || order?.guestInfo?.email || user?.email || "",
    },
    table: table
      ? {
          id: table._id,
          name: table.name,
          tableType: tableType?.name || "",
        }
      : null,
    items: orderLines,
    summary: {
      subTotal,
      depositAmount,
      totalAmount,
    },
  };
}

// GET /api/staff/dashboard/orders/:id/invoice  (Staff / Admin)

export const getStaffOrderInvoice = async (req, res) => {
  try {
    const payload = await buildStaffInvoicePayload(req.params.id);
    if (!payload) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// GET /api/staff/dashboard/orders/:id/invoice/export  (Staff / Admin)

export const exportStaffOrderInvoice = async (req, res) => {
  try {
    const payload = await buildStaffInvoicePayload(req.params.id);
    if (!payload) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    const escapeCsv = (val) => {
      const text = String(val ?? "").replace(/"/g, '""');
      return `"${text}"`;
    };

    const lines = [
      ["Invoice Code", payload.invoiceCode],
      ["Order Code", payload.order.orderCode],
      ["Booking Code", payload.booking?.bookingCode || "Walk-in"],
      ["Customer", payload.customer.name],
      ["Phone", payload.customer.phone],
      ["Table", payload.table?.name || ""],
      ["Status", payload.order.status],
      [],
      ["Menu", "Quantity", "Unit Price", "Line Total", "Note"],
      ...payload.items.map((x) => [
        x.menuName,
        x.quantity,
        x.unitPrice,
        x.lineTotal,
        x.note,
      ]),
      [],
      ["Subtotal", payload.summary.subTotal],
      ["Deposit", payload.summary.depositAmount],
      ["Grand Total", payload.summary.totalAmount],
    ];

    const csv = lines
      .map((row) => row.map((c) => escapeCsv(c)).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${String(payload.order.id).slice(-6).toUpperCase()}.csv`,
    );
    res.send(`\uFEFF${csv}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// GET /api/staff/dashboard/stats  (Staff / Admin)
export const getStaffDashboardStats = async (req, res) => {
  try {
    const todayInVietnam = getVietnamDateString();
    const todayRange = getVietnamDateRange(todayInVietnam);
    const todayStart = todayRange.from;
    const todayEnd = todayRange.to;

    const [totalTables, occupiedTables, todayOrders, recentOrders] =
      await Promise.all([
        Table.countDocuments(),
        Table.countDocuments({ status: "Occupied" }),
        Order.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
        Order.find().sort({ createdAt: -1 }).limit(10).lean(),
      ]);

    const orderIds = recentOrders.map((o) => o._id);
    const bookingIds = [
      ...new Set(
        recentOrders.map((o) => o.bookingId?.toString()).filter(Boolean),
      ),
    ];

    const [recentOrderItems, recentBookings, recentUsers] = await Promise.all([
      OrderItem.find({ orderId: { $in: orderIds } }).lean(),
      Booking.find({ _id: { $in: bookingIds } }).lean(),
      User.find({
        _id: {
          $in: [
            ...new Set(
              recentOrders.map((o) => o.userId?.toString()).filter(Boolean),
            ),
          ],
        },
      }).lean(),
    ]);

    const tableIds = [
      ...new Set(
        recentBookings.map((b) => b.tableId?.toString()).filter(Boolean),
      ),
    ];
    const recentTables = await Table.find({ _id: { $in: tableIds } }).lean();

    const bkMap = new Map(recentBookings.map((b) => [b._id.toString(), b]));
    const tbMap = new Map(recentTables.map((t) => [t._id.toString(), t]));
    const usrMap = new Map(recentUsers.map((u) => [u._id.toString(), u]));
    const oimMap = new Map();
    for (const oi of recentOrderItems) {
      const key = oi.orderId?.toString();
      oimMap.set(key, (oimMap.get(key) || 0) + 1);
    }

    const statusCounts = {
      ["PENDING"]: 0,
      ["CONFIRMED"]: 0,
      ["COMPLETED"]: 0,
      ["CANCELLED"]: 0,
    };
    for (const o of todayOrders) {
      if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
    }

    const activity = recentOrders.map((o) => {
      const bk = bkMap.get(o.bookingId?.toString());
      const tb = tbMap.get(bk?.tableId?.toString());
      const usr =
        usrMap.get(bk?.userId?.toString()) || usrMap.get(o.userId?.toString());
      return {
        orderId: o._id,
        orderCode: `#${String(o._id).slice(-6).toUpperCase()}`,
        customerName: bk?.guestInfo?.name || usr?.fullName || "Khách lẻ",
        tableName: tb?.name || "Walk-in",
        status: o.status || "PENDING",
        totalAmount: Number(o.totalAmount || 0),
        itemCount: oimMap.get(o._id.toString()) || 0,
        createdAt: o.createdAt,
      };
    });

    res.json({
      tables: {
        total: totalTables,
        occupied: occupiedTables,
        available: totalTables - occupiedTables,
      },
      orders: { total: todayOrders.length, ...statusCounts },
      activity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// GET /api/payments/:bookingId  — get payment page data



