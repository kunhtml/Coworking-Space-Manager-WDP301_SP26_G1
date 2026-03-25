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
import { ORDER_STATUS, normalizeOrderStatus } from "../constants/domain.js";

const STAFF_TABLE_STATUSES = new Set([
  "Available",
  "Occupied",
  "Reserved",
  "Maintenance",
  "Cleaning",
]);

const ACCEPTED_ORDER_STATUS_INPUTS = new Set([
  ...Object.values(ORDER_STATUS),
  "NEW",
  "PAID",
  "CANCELED",
  "CANCELLED",
]);

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || ""));
}

function normalizeOrderRows(
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
    const normalizedOrderStatus = normalizeOrderStatus(o.status);
    const invoice = invoiceMap.get(o._id.toString()) || null;
    const invoiceRemaining = Number(invoice?.remainingAmount || 0);
    const invoiceStatus = String(invoice?.status || "").toUpperCase();
    const isPaid = invoiceStatus === "PAID" || invoiceRemaining <= 0;

    let paymentStatus = "WAITING_PAYMENT";
    if (normalizedOrderStatus === ORDER_STATUS.CANCELLED) {
      paymentStatus = "CANCELLED";
    } else if (isPaid) {
      paymentStatus = "PAID";
    }

    let staffStatus = "WAITING_PAYMENT";
    if (normalizedOrderStatus === ORDER_STATUS.CANCELLED) {
      staffStatus = "CANCELLED";
    } else if (normalizedOrderStatus === ORDER_STATUS.COMPLETED) {
      staffStatus = "COMPLETED";
    } else if (isPaid) {
      staffStatus = "PAID";
    }

    const booking = bookingMap.get(o.bookingId?.toString());
    const table = tableMap.get(booking?.tableId?.toString());
    const user =
      userMap.get(booking?.userId?.toString()) ||
      userMap.get(o.userId?.toString());

    return {
      id: o._id,
      orderCode: "#" + String(o._id).slice(-6).toUpperCase(),
      bookingId: o.bookingId || null,
      bookingCode: booking?.bookingCode || "Walk-in",
      tableId: booking?.tableId || null,
      tableName: table?.name || "Khong xac dinh",
      customerName: booking?.guestInfo?.name || user?.fullName || "Khach le",
      customerPhone: booking?.guestInfo?.phone || user?.phone || "",
      status: normalizedOrderStatus,
      staffStatus,
      paymentStatus,
      invoiceStatus: invoice?.status || "Pending",
      remainingAmount: invoiceRemaining,
      totalAmount: Number(o.totalAmount || 0),
      createdAt: o.createdAt,
      items: itemMap.get(o._id.toString()) || [],
    };
  });
}

export const getStaffTableStatusList = async (req, res) => {
  try {
    const { status, search } = req.query;
    const tableFilter = {};

    if (status && status !== "all") {
      tableFilter.status = status;
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
    const now = new Date();
    const activeBookings = await Booking.find({
      tableId: { $in: tableIds },
      status: {
        $in: ["Pending", "Awaiting_Payment", "Confirmed", "CheckedIn"],
      },
      startTime: { $lte: now },
      endTime: { $gte: now },
    })
      .sort({ startTime: 1 })
      .lean();

    const bookingMap = new Map();
    for (const b of activeBookings) {
      const key = b.tableId?.toString();
      if (!key || bookingMap.has(key)) continue;
      bookingMap.set(key, b);
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

    if (status && status !== "all") {
      const rawStatus = String(status).trim();
      const normalizedStatus = normalizeOrderStatus(rawStatus);
      orderFilter.status = {
        $in: [
          ...new Set([rawStatus, rawStatus.toUpperCase(), normalizedStatus]),
        ],
      };
    }

    if (date) {
      const from = new Date(`${date}T00:00:00.000+07:00`);
      const to = new Date(`${date}T23:59:59.999+07:00`);
      orderFilter.createdAt = { $gte: from, $lte: to };
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

    const rows = normalizeOrderRows(
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

// POST /api/staff/dashboard/orders/counter  (Staff / Admin)

export const createCounterOrder = async (req, res) => {
  try {
    const {
      bookingId,
      tableId,
      items,
      customerName,
      customerPhone,
      durationHours,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 món." });
    }

    let booking = null;
    if (bookingId) {
      if (!isValidObjectId(bookingId)) {
        return res.status(400).json({ message: "bookingId không hợp lệ." });
      }
      booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy booking." });
      }
    } else {
      if (!tableId || !isValidObjectId(tableId)) {
        return res
          .status(400)
          .json({ message: "Vui lòng chọn tableId hợp lệ cho counter order." });
      }

      const table = await Table.findById(tableId).lean();
      if (!table) {
        return res.status(404).json({ message: "Không tìm thấy bàn." });
      }

      const start = new Date();
      const hrs = Math.max(1, Number(durationHours || 2));
      const end = new Date(start.getTime() + hrs * 3600000);
      const bookingCode = `WALK-${Date.now().toString().slice(-6)}`;

      // Calculate deposit based on table price and duration
      const pricePerHour = Number(table.pricePerHour || 0);
      if (pricePerHour === 0) {
        return res.status(400).json({
          message: "Bàn chưa có giá. Vui lòng cập nhật giá bàn trước.",
        });
      }
      const depositAmount = Math.round(pricePerHour * hrs);

      booking = await Booking.create({
        bookingCode,
        tableId: table._id,
        startTime: start,
        endTime: end,
        status: "CheckedIn",
        depositAmount,
        guestInfo: {
          name: customerName || "Khách lẻ",
          phone: customerPhone || "",
        },
      });

      await Table.findByIdAndUpdate(table._id, { status: "Occupied" });
    }

    const menuIds = [
      ...new Set(items.map((i) => i.menuItemId).filter(Boolean)),
    ];
    const menus = await MenuItem.find({ _id: { $in: menuIds } }).lean();
    const menuMap = new Map(menus.map((m) => [m._id.toString(), m]));

    const normalized = [];
    for (const it of items) {
      const qty = Number(it.quantity || 0);
      if (!it.menuItemId || qty <= 0) continue;
      const menu = menuMap.get(String(it.menuItemId));
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
      userId: booking.userId || req.user.id,
      bookingId: booking._id,
      status: ORDER_STATUS.PENDING,
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

    // Create combined invoice for booking + order
    const bookingAmount = Math.round(Number(booking.depositAmount || 0));
    const orderAmount = Math.round(Number(order.totalAmount || 0));
    const combinedTotal = bookingAmount + orderAmount;

    const invoice = await Invoice.create({
      bookingId: booking._id,
      orderIds: [order._id],
      totalAmount: combinedTotal,
      remainingAmount: combinedTotal,
      status: combinedTotal > 0 ? "Pending" : "Paid",
    });

    // Create payment link
    const origin =
      req.get("origin") || `http://localhost:${process.env.PORT || 5000}`;
    const paymentResult = await createCounterOrderPayment({
      booking,
      order,
      invoice,
      buyer: {
        name: customerName || "Khách lẻ",
        phone: customerPhone || "",
      },
      origin,
    });

    res.status(201).json({
      message: "Tạo counter order thành công.",
      bookingId: booking._id,
      orderId: order._id,
      orderCode: `#${String(order._id).slice(-6).toUpperCase()}`,
      invoiceId: invoice._id,
      payment: paymentResult,
      bookingAmount,
      orderAmount,
      totalAmount: combinedTotal,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
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

    let touched = false;
    if (typeof status === "string" && status.trim()) {
      const rawStatus = status.trim().toUpperCase();
      if (!ACCEPTED_ORDER_STATUS_INPUTS.has(rawStatus)) {
        return res
          .status(400)
          .json({ message: "Trạng thái đơn hàng không hợp lệ." });
      }
      const targetStatus = normalizeOrderStatus(rawStatus);
      if (targetStatus === ORDER_STATUS.COMPLETED) {
        const invoice = await Invoice.findOne({ orderIds: order._id })
          .select("status remainingAmount")
          .lean();
        const invoiceRemaining = Number(invoice?.remainingAmount || 0);
        const invoiceStatus = String(invoice?.status || "").toUpperCase();
        const isPaid = invoiceStatus === "PAID" || invoiceRemaining <= 0;
        if (!isPaid) {
          return res.status(400).json({
            message: "Đơn chưa thanh toán, không thể xác nhận hoàn thành.",
          });
        }
      }
      order.status = targetStatus;
      touched = true;
    } else {
      order.status = normalizeOrderStatus(order.status);
    }

    if (Array.isArray(items)) {
      const menuIds = [
        ...new Set(items.map((i) => i.menuItemId).filter(Boolean)),
      ];
      const menus = await MenuItem.find({ _id: { $in: menuIds } }).lean();
      const menuMap = new Map(menus.map((m) => [m._id.toString(), m]));

      const normalized = [];
      for (const it of items) {
        const qty = Number(it.quantity || 0);
        if (!it.menuItemId || qty <= 0) continue;
        const menu = menuMap.get(String(it.menuItemId));
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

      order.totalAmount = normalized.reduce(
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
      message: "Cập nhật đơn hàng thành công.",
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
    generatedAt: new Date().toISOString(),
    order: {
      id: order._id,
      orderCode: `#${String(order._id).slice(-6).toUpperCase()}`,
      status: order.status || "Pending",
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
      name: booking?.guestInfo?.name || user?.fullName || "Khách lẻ",
      phone: booking?.guestInfo?.phone || user?.phone || "",
      email: booking?.guestInfo?.email || user?.email || "",
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
    const now = new Date();
    const todayStart = new Date(
      `${now.toISOString().slice(0, 10)}T00:00:00.000+07:00`,
    );
    const todayEnd = new Date(
      `${now.toISOString().slice(0, 10)}T23:59:59.999+07:00`,
    );

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
      Pending: 0,
      Confirmed: 0,
      Completed: 0,
      Cancelled: 0,
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
        status: o.status || "Pending",
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
