import mongoose from "mongoose";
import Booking from "../models/booking.js";
import Order from "../models/order.js";
import OrderItem from "../models/order_item.js";
import Table from "../models/table.js";
import TableType from "../models/tableType.js";
import MenuItem from "../models/menu_item.js";
import User from "../models/user.js";
import Invoice from "../models/invoice.js";
import Payment from "../models/payment.js";
import {
  createOrReuseOrderPayOSPayment,
  isPayOSConfigured,
} from "../services/payos.service.js";
import {
  ORDER_STATUS,
  canTransitionOrderStatus,
  normalizeOrderStatus,
  normalizePaymentMethod,
  PAYMENT_METHOD,
  PAYMENT_METHOD_VALUES,
} from "../constants/domain.js";

const STAFF_TABLE_STATUSES = new Set([
  "Available",
  "Occupied",
  "Reserved",
  "Maintenance",
  "Cleaning",
]);
const COUNTER_BOOKING_BLOCKED_STATUSES = new Set([
  "Cancelled",
  "Canceled",
  "Completed",
]);

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || ""));
}

function resolveFrontendOrigin(req) {
  return (
    req.get("origin") ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
  );
}

async function recalculateInvoice(invoice) {
  const successPayments = await Payment.find({
    invoiceId: invoice._id,
    paymentStatus: "Success",
  }).lean();

  const totalPaid = successPayments.reduce(
    (sum, payment) => sum + Math.round(Number(payment.amount || 0)),
    0,
  );

  invoice.remainingAmount = Math.max(
    0,
    Math.round(Number(invoice.totalAmount || 0) - totalPaid),
  );
  invoice.status =
    invoice.remainingAmount <= 0
      ? "Paid"
      : totalPaid > 0
        ? "Partially_Paid"
        : "Pending";

  await invoice.save();
  return invoice;
}

function normalizeOrderRows(orders, orderItems, menuMap, bookingMap, tableMap, userMap) {
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
    const booking = bookingMap.get(o.bookingId?.toString());
    const table = tableMap.get(booking?.tableId?.toString());
    const user = userMap.get(booking?.userId?.toString()) || userMap.get(o.userId?.toString());

    return {
      id: o._id,
      orderCode: "#" + String(o._id).slice(-6).toUpperCase(),
      bookingId: o.bookingId || null,
      bookingCode: booking?.bookingCode || "Walk-in",
      tableId: booking?.tableId || null,
      tableName: table?.name || "Khong xac dinh",
      customerName: booking?.guestInfo?.name || user?.fullName || "Khach le",
      customerPhone: booking?.guestInfo?.phone || user?.phone || "",
      status: normalizeOrderStatus(o.status),
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

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      tables = tables.filter(
        (t) =>
          String(t.name || "").toLowerCase().includes(q) ||
          String(t.tableType || "").toLowerCase().includes(q),
      );
    }

    const tableIds = tables.map((t) => t._id);
    const now = new Date();
    const activeBookings = await Booking.find({
      tableId: { $in: tableIds },
      status: { $in: ["Pending", "Awaiting_Payment", "Confirmed", "CheckedIn"] },
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
        tableType: t.tableType,
        capacity: Number(t.capacity || 0),
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
      { new: true },
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
      orderFilter.status = normalizeOrderStatus(status);
    }

    if (date) {
      const from = new Date(`${date}T00:00:00.000+07:00`);
      const to = new Date(`${date}T23:59:59.999+07:00`);
      orderFilter.createdAt = { $gte: from, $lte: to };
    }

    let orders = await Order.find(orderFilter).sort({ createdAt: -1 }).lean();

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      orders = orders.filter((o) => String(o._id).slice(-6).toLowerCase().includes(q));
    }

    const orderIds = orders.map((o) => o._id);
    const bookingIds = [
      ...new Set(orders.map((o) => o.bookingId?.toString()).filter(Boolean)),
    ];
    const userIds = [
      ...new Set(orders.map((o) => o.userId?.toString()).filter(Boolean)),
    ];

    const [orderItems, bookings, users] = await Promise.all([
      OrderItem.find({ orderId: { $in: orderIds } }).lean(),
      Booking.find({ _id: { $in: bookingIds } }).lean(),
      User.find({ _id: { $in: userIds } }).lean(),
    ]);

    const tableIds = [
      ...new Set(bookings.map((b) => b.tableId?.toString()).filter(Boolean)),
    ];
    const menuIds = [
      ...new Set(orderItems.map((i) => i.menuItemId?.toString()).filter(Boolean)),
    ];

    const [tables, menuItems] = await Promise.all([
      Table.find({ _id: { $in: tableIds } }).lean(),
      MenuItem.find({ _id: { $in: menuIds } }).lean(),
    ]);

    const bookingMap = new Map(bookings.map((b) => [b._id.toString(), b]));
    const tableMap = new Map(tables.map((t) => [t._id.toString(), t]));
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const menuMap = new Map(menuItems.map((m) => [m._id.toString(), m]));

    const rows = normalizeOrderRows(
      orders,
      orderItems,
      menuMap,
      bookingMap,
      tableMap,
      userMap,
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
      paymentMethod,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 món." });
    }

    const normalizedMethod = paymentMethod
      ? normalizePaymentMethod(paymentMethod)
      : null;

    if (normalizedMethod && !PAYMENT_METHOD_VALUES.includes(normalizedMethod)) {
      return res.status(400).json({
        message: "Phương thức thanh toán chỉ hỗ trợ CASH hoặc QR_PAYOS.",
      });
    }

    if (normalizedMethod === PAYMENT_METHOD.QR_PAYOS && !isPayOSConfigured()) {
      return res.status(400).json({ message: "PayOS chưa được cấu hình." });
    }

    const menuIds = [...new Set(items.map((i) => i.menuItemId).filter(Boolean))];
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

    let booking = null;
    let table = null;
    let invoice = null;
    let order;
    let payment = null;
    let paymentResult = null;
    let bookingAmount = 0;

    if (bookingId) {
      if (!isValidObjectId(bookingId)) {
        return res.status(400).json({ message: "bookingId không hợp lệ." });
      }

      booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy booking." });
      }
      if (COUNTER_BOOKING_BLOCKED_STATUSES.has(String(booking.status || ""))) {
        return res.status(400).json({
          message: "Booking đã hủy hoặc hoàn tất, không thể tạo đơn tại quầy.",
        });
      }

      table = booking.tableId ? await Table.findById(booking.tableId).lean() : null;
      bookingAmount = Math.round(Number(booking.depositAmount || 0));
      invoice = await Invoice.findOne({ bookingId: booking._id });
      if (!invoice) {
        invoice = await Invoice.create({
          bookingId: booking._id,
          orderIds: [],
          totalAmount: bookingAmount,
          remainingAmount: bookingAmount,
          status: bookingAmount > 0 ? "Pending" : "Paid",
        });
      }
    } else {
      if (!tableId || !isValidObjectId(tableId)) {
        return res.status(400).json({ message: "tableId không hợp lệ." });
      }

      table = await Table.findById(tableId).lean();
      if (!table) {
        return res.status(404).json({ message: "Không tìm thấy bàn." });
      }
      if (String(table.status || "") === "Maintenance") {
        return res.status(400).json({
          message: "Bàn đang bảo trì, không thể tạo đơn tại quầy.",
        });
      }

      const effectiveDuration = Math.max(1, Number(durationHours || 1));
      const startTime = new Date();
      const endTime = new Date(
        startTime.getTime() + effectiveDuration * 3600000,
      );

      const overlapping = await Booking.find({
        tableId: table._id,
        status: { $nin: ["Cancelled", "Canceled", "Completed"] },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      }).lean();

      if (overlapping.length > 0) {
        return res.status(409).json({
          message: "Bàn đang có khách hoặc đã được đặt trong khung giờ này.",
        });
      }

      const count = await Booking.countDocuments();
      bookingAmount = Math.round(
        Number(table.pricePerHour || 0) * effectiveDuration,
      );

      booking = await Booking.create({
        bookingCode: `BK-${String(count + 1).padStart(4, "0")}`,
        userId: null,
        tableId: table._id,
        startTime,
        endTime,
        status: "CheckedIn",
        depositAmount: bookingAmount,
        guestInfo: {
          name: customerName?.trim() || "Khách lẻ",
          phone: customerPhone?.trim() || "",
        },
      });

      await Table.findByIdAndUpdate(table._id, { status: "Occupied" });

      invoice = await Invoice.create({
        bookingId: booking._id,
        orderIds: [],
        totalAmount: bookingAmount,
        remainingAmount: bookingAmount,
        status: bookingAmount > 0 ? "Pending" : "Paid",
      });
    }

    order = await Order.create({
      userId: booking?.userId || null,
      bookingId: booking?._id || null,
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

    invoice.orderIds = [...new Set([...(invoice.orderIds || []), order._id])];
    invoice.totalAmount = Math.round(Number(invoice.totalAmount || 0) + totalAmount);
    await recalculateInvoice(invoice);

    if (normalizedMethod === PAYMENT_METHOD.CASH) {
      const amountToPay = Math.max(
        0,
        Math.round(
          Number(
            invoice.remainingAmount ??
              invoice.totalAmount ??
              order.totalAmount ??
              0,
          ),
        ),
      );

      payment = await Payment.create({
        invoiceId: invoice._id,
        bookingId: booking?._id || null,
        paymentMethod: normalizedMethod,
        transactionId: `COUNTER_${normalizedMethod}_${Date.now()}`,
        amount: amountToPay,
        type: "Payment",
        paymentStatus: "Success",
        paidAt: new Date(),
      });

      invoice.remainingAmount = 0;
      invoice.status = "Paid";
      await invoice.save();

      order.status = ORDER_STATUS.CONFIRMED;
      await order.save();

      if (
        booking &&
        ["Pending", "Awaiting_Payment", "Confirmed"].includes(
          String(booking.status || ""),
        )
      ) {
        booking.status = "Confirmed";
        await booking.save();
      }
    }

    if (normalizedMethod === PAYMENT_METHOD.QR_PAYOS) {
      try {
        const origin = resolveFrontendOrigin(req);
      const payosOrderResult = await createOrReuseOrderPayOSPayment({
        order,
        buyer: {
          fullName:
            booking?.guestInfo?.name ||
            customerName?.trim() ||
            "Khách lẻ",
          phone:
            booking?.guestInfo?.phone ||
            customerPhone?.trim() ||
            "",
          email: booking?.guestInfo?.email || undefined,
        },
        origin,
        returnPath: "/staff-dashboard/orders?payment=success",
        cancelPath: "/staff-dashboard/orders?payment=cancelled",
      });

        paymentResult = {
        created: !payosOrderResult?.reused,
        reused: Boolean(payosOrderResult?.reused),
        payment: payosOrderResult?.payment || null,
        checkoutUrl: payosOrderResult?.payment?.payos?.checkoutUrl || null,
        qrCode: payosOrderResult?.payment?.payos?.qrCode || null,
        };
      } catch (payosError) {
        return res.status(502).json({
          message:
            payosError?.message ||
            "KhÃ´ng táº¡o Ä‘Æ°á»£c giao dá»‹ch PayOS cho counter order.",
        });
      }
    }

    res.status(201).json({
      message: "Tạo counter order thành công.",
      bookingId: booking?._id || null,
      bookingCode: booking?.bookingCode || null,
      orderId: order._id,
      orderCode: `#${String(order._id).slice(-6).toUpperCase()}`,
      invoiceId: invoice._id,
      method: normalizedMethod || null,
      payment: paymentResult,
      paymentRecordId: payment?._id || null,
      bookingAmount,
      orderAmount: Math.round(Number(order.totalAmount || 0)),
      totalAmount: Math.round(Number(invoice.totalAmount || 0)),
      remainingAmount: Math.round(Number(invoice.remainingAmount || 0)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Lỗi server." });
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
      const nextStatus = normalizeOrderStatus(status);
      const currentStatus = normalizeOrderStatus(order.status);
      if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
        return res.status(400).json({
          message: `Không thể chuyển trạng thái từ ${currentStatus} sang ${nextStatus}.`,
        });
      }
      order.status = nextStatus;
      touched = true;
    }

    if (Array.isArray(items)) {
      const menuIds = [...new Set(items.map((i) => i.menuItemId).filter(Boolean))];
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

      const oldTotalAmount = Number(order.totalAmount || 0);
      order.totalAmount = normalized.reduce(
        (sum, i) => sum + Number(i.quantity) * Number(i.priceAtOrder),
        0,
      );

      const invoice = await Invoice.findOne({ orderIds: order._id });
      if (invoice) {
        const totalDiff = Math.round(Number(order.totalAmount || 0) - oldTotalAmount);
        invoice.totalAmount = Math.round(Number(invoice.totalAmount || 0) + totalDiff);

        const successPayments = await Payment.find({
          invoiceId: invoice._id,
          paymentStatus: "Success",
        }).lean();
        const totalPaid = successPayments.reduce(
          (s, p) => s + Math.round(Number(p.amount || 0)),
          0,
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

      touched = true;
    }

    if (!touched) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để cập nhật." });
    }

    await order.save();

    res.json({
      message: "Cập nhật đơn hàng thành công.",
      order: {
        id: order._id,
        status: normalizeOrderStatus(order.status),
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

  const [booking, items, invoice] = await Promise.all([
    order.bookingId ? Booking.findById(order.bookingId).lean() : null,
    OrderItem.find({ orderId: order._id }).lean(),
    Invoice.findOne({ orderIds: order._id }).lean(),
  ]);

  const [table, user] = await Promise.all([
    booking?.tableId ? Table.findById(booking.tableId).lean() : null,
    booking?.userId ? User.findById(booking.userId).lean() : null,
  ]);

  const menuIds = [...new Set(items.map((i) => i.menuItemId?.toString()).filter(Boolean))];
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
  const depositAmount =
    invoice?.bookingId && booking ? Number(booking.depositAmount || 0) : 0;
  const totalAmount = Number(invoice?.totalAmount ?? subTotal + depositAmount);
  const remainingAmount = Number(
    invoice?.remainingAmount ?? Math.max(totalAmount, 0),
  );

  return {
    invoiceCode: `INV-${String(order._id).slice(-6).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    order: {
      id: order._id,
      orderCode: `#${String(order._id).slice(-6).toUpperCase()}`,
      status: normalizeOrderStatus(order.status),
      createdAt: order.createdAt,
      totalAmount: Number(order.totalAmount || 0),
    },
    booking: booking
      ? {
          id: booking._id,
          bookingCode: booking.bookingCode || `#${String(booking._id).slice(-6).toUpperCase()}`,
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
          tableType: table.tableType,
        }
      : null,
    items: orderLines,
    summary: {
      subTotal,
      depositAmount,
      totalAmount,
      remainingAmount,
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
      ...payload.items.map((x) => [x.menuName, x.quantity, x.unitPrice, x.lineTotal, x.note]),
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
    const todayStart = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000+07:00`);
    const todayEnd   = new Date(`${now.toISOString().slice(0, 10)}T23:59:59.999+07:00`);

    const [
      totalTables,
      occupiedTables,
      todayOrders,
      recentOrders,
    ] = await Promise.all([
      Table.countDocuments(),
      Table.countDocuments({ status: "Occupied" }),
      Order.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
      Order.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const orderIds = recentOrders.map((o) => o._id);
    const bookingIds = [...new Set(recentOrders.map((o) => o.bookingId?.toString()).filter(Boolean))];

    const [recentOrderItems, recentBookings, recentUsers] = await Promise.all([
      OrderItem.find({ orderId: { $in: orderIds } }).lean(),
      Booking.find({ _id: { $in: bookingIds } }).lean(),
      User.find({ _id: { $in: [...new Set(recentOrders.map((o) => o.userId?.toString()).filter(Boolean))] } }).lean(),
    ]);

    const tableIds = [...new Set(recentBookings.map((b) => b.tableId?.toString()).filter(Boolean))];
    const recentTables = await Table.find({ _id: { $in: tableIds } }).lean();

    const bkMap  = new Map(recentBookings.map((b) => [b._id.toString(), b]));
    const tbMap  = new Map(recentTables.map((t) => [t._id.toString(), t]));
    const usrMap = new Map(recentUsers.map((u) => [u._id.toString(), u]));
    const oimMap = new Map();
    for (const oi of recentOrderItems) {
      const key = oi.orderId?.toString();
      oimMap.set(key, (oimMap.get(key) || 0) + 1);
    }

    const statusCounts = {
      [ORDER_STATUS.PENDING]: 0,
      [ORDER_STATUS.CONFIRMED]: 0,
      [ORDER_STATUS.PREPARING]: 0,
      [ORDER_STATUS.SERVED]: 0,
      [ORDER_STATUS.COMPLETED]: 0,
      [ORDER_STATUS.CANCELLED]: 0,
    };
    for (const o of todayOrders) {
      const key = normalizeOrderStatus(o.status);
      if (statusCounts[key] !== undefined) statusCounts[key]++;
    }

    const activity = recentOrders.map((o) => {
      const bk  = bkMap.get(o.bookingId?.toString());
      const tb  = tbMap.get(bk?.tableId?.toString());
      const usr = usrMap.get(bk?.userId?.toString()) || usrMap.get(o.userId?.toString());
      return {
        orderId:      o._id,
        orderCode:    `#${String(o._id).slice(-6).toUpperCase()}`,
        customerName: bk?.guestInfo?.name || usr?.fullName || "Khách lẻ",
        tableName:    tb?.name || "Walk-in",
        status:       normalizeOrderStatus(o.status),
        totalAmount:  Number(o.totalAmount || 0),
        itemCount:    oimMap.get(o._id.toString()) || 0,
        createdAt:    o.createdAt,
      };
    });

    res.json({
      tables:  { total: totalTables, occupied: occupiedTables, available: totalTables - occupiedTables },
      orders:  { total: todayOrders.length, ...statusCounts },
      activity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// GET /api/payments/:bookingId  — get payment page data
