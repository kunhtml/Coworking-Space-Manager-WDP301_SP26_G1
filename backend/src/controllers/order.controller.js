import Booking from "../models/booking.js";
import Order from "../models/order.js";
import OrderItem from "../models/order_item.js";
import MenuItem from "../models/menu_item.js";
import Invoice from "../models/invoice.js";
import Payment from "../models/payment.js";

const normalizeOrderStatus = (status) => {
  if (!status) return "Pending";
  return status === "Completed" ? "Served" : status;
};

export const getMyOrders = async (req, res) => {
  try {
    const myBookings = await Booking.find({ userId: req.user.id })
      .select("_id")
      .lean();
    const myBookingIdSet = new Set(myBookings.map((b) => b._id.toString()));

    // Keep backward compatibility for old orders that may not have userId set correctly.
    const allOrders = await Order.find({}).sort({ createdAt: -1 }).lean();
    const orders = allOrders.filter(
      (o) =>
        o.userId?.toString() === req.user.id ||
        myBookingIdSet.has(o.bookingId?.toString()),
    );

    const orderIds = orders.map((o) => o._id);
    const bookingIds = [
      ...new Set(orders.map((o) => o.bookingId?.toString()).filter(Boolean)),
    ];

    const [items, bookings] = await Promise.all([
      OrderItem.find({ orderId: { $in: orderIds } }).lean(),
      Booking.find({ _id: { $in: bookingIds } }).lean(),
    ]);

    const menuIds = [
      ...new Set(items.map((i) => i.menuItemId?.toString()).filter(Boolean)),
    ];
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
        menuName: menu?.name || i.itemName || "Món không xác định",
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
        status: normalizeOrderStatus(o.status),
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
      return res
        .status(400)
        .json({ message: "Vui lòng chọn booking và ít nhất 1 món." });
    }

    const booking = await Booking.findById(bookingId).lean();
    if (!booking || booking.userId?.toString() !== req.user.id) {
      return res.status(404).json({ message: "Không tìm thấy booking." });
    }
    if (booking.status === "Cancelled") {
      return res
        .status(400)
        .json({ message: "Booking đã hủy, không thể tạo đơn hàng." });
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
      totalAmount: Math.round(totalAmount),
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

    // Create separate invoice for this order (not shared with booking)
    const orderInvoice = await Invoice.create({
      // No bookingId - this is an order invoice, separate from booking deposit
      orderIds: [order._id],
      totalAmount: Math.round(totalAmount),
      remainingAmount: Math.round(totalAmount),
      status: "Pending",
    });

    console.log(
      `Created separate invoice ${orderInvoice._id} for order ${order._id}`,
    );

    res
      .status(201)
      .json({ message: "Tạo đơn hàng thành công.", orderId: order._id });
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
      return res
        .status(400)
        .json({ message: "Vui lòng truyền danh sách món cần cập nhật." });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    const booking = order.bookingId
      ? await Booking.findById(order.bookingId).lean()
      : null;
    const isOwnerByOrder = order.userId?.toString() === req.user.id;
    const isOwnerByBooking = booking?.userId?.toString() === req.user.id;
    if (!isOwnerByOrder && !isOwnerByBooking) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    if (["Confirmed", "Cancelled"].includes(order.status)) {
      return res.status(400).json({
        message: "Đơn hàng đã xác nhận hoặc đã hủy, không thể chỉnh sửa.",
      });
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

    const oldTotalAmount = Number(order.totalAmount || 0);
    const newTotalAmount = Math.round(totalAmount);

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

    order.totalAmount = newTotalAmount;
    await order.save();

    // Update invoice for this order (find invoice containing this orderId)
    const invoice = await Invoice.findOne({ orderIds: order._id });
    if (invoice) {
      // Adjust total: remove old order amount, add new order amount
      const totalDiff = newTotalAmount - oldTotalAmount;
      invoice.totalAmount = Math.round(
        Number(invoice.totalAmount || 0) + totalDiff,
      );

      // Recalculate remaining
      const successPayments = await Payment.find({
        invoiceId: invoice._id,
        paymentStatus: "Success",
      }).lean();
      const totalPaid = successPayments.reduce(
        (s, p) => s + Math.round(Number(p.amount || 0)),
        0,
      );
      invoice.remainingAmount = Math.max(0, invoice.totalAmount - totalPaid);

      // Update status
      if (invoice.remainingAmount <= 0) {
        invoice.status = "Paid";
      } else if (totalPaid > 0) {
        invoice.status = "Partially_Paid";
      } else {
        invoice.status = "Pending";
      }

      await invoice.save();
      console.log(`Updated invoice ${invoice._id} for order ${order._id}`);
    }

    res.json({ message: "Cập nhật đơn hàng thành công." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// ─── Payment Controllers ───────────────────────────────────────────

// GET /api/bookings/all  (Staff / Admin)
