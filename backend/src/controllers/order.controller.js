import Booking from "../models/booking.js";
import Order from "../models/order.js";
import OrderItem from "../models/order_item.js";
import MenuItem from "../models/menu_item.js";
import Invoice from "../models/invoice.js";
import Payment from "../models/payment.js";
import {
  ORDER_STATUS,
  normalizeOrderStatus,
} from "../constants/domain.js";

const BLOCKED_BOOKING_STATUSES = new Set(["Cancelled", "Canceled"]);

function mapOrderRow(order, bookingMap, itemMap) {
  const booking = bookingMap.get(order.bookingId?.toString());
  return {
    id: order._id,
    bookingId: order.bookingId,
    status: normalizeOrderStatus(order.status),
    totalAmount: Number(order.totalAmount || 0),
    createdAt: order.createdAt,
    bookingStatus: booking?.status || "Unknown",
    items: itemMap.get(order._id.toString()) || [],
  };
}

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

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
    const menus = await MenuItem.find({ _id: { $in: menuIds } }).lean();

    const bookingMap = new Map(bookings.map((b) => [b._id.toString(), b]));
    const menuMap = new Map(menus.map((m) => [m._id.toString(), m]));

    const itemMap = new Map();
    for (const item of items) {
      const key = item.orderId?.toString();
      const arr = itemMap.get(key) || [];
      const menu = menuMap.get(item.menuItemId?.toString());
      arr.push({
        id: item._id,
        menuItemId: item.menuItemId,
        menuName: menu?.name || item.itemName || "Món không xác định",
        quantity: Number(item.quantity || 0),
        priceAtOrder: Number(item.priceAtOrder || 0),
        note: item.note || "",
        lineTotal: Number(item.quantity || 0) * Number(item.priceAtOrder || 0),
      });
      itemMap.set(key, arr);
    }

    res.json(orders.map((o) => mapOrderRow(o, bookingMap, itemMap)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

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
    if (BLOCKED_BOOKING_STATUSES.has(String(booking.status || ""))) {
      return res
        .status(400)
        .json({ message: "Booking đã hủy, không thể tạo đơn hàng." });
    }

    const menuIds = [...new Set(items.map((i) => i.menuItemId).filter(Boolean))];
    const menus = await MenuItem.find({ _id: { $in: menuIds } }).lean();
    const menuMap = new Map(menus.map((m) => [m._id.toString(), m]));

    const normalizedItems = [];
    for (const item of items) {
      const qty = Number(item.quantity || 0);
      if (!item.menuItemId || qty <= 0) continue;
      const menu = menuMap.get(String(item.menuItemId));
      if (!menu) continue;
      normalizedItems.push({
        menuItemId: menu._id,
        quantity: qty,
        note: item.note || "",
        priceAtOrder: Number(menu.price || 0),
      });
    }

    if (!normalizedItems.length) {
      return res.status(400).json({ message: "Danh sách món không hợp lệ." });
    }

    const totalAmount = Math.round(
      normalizedItems.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.priceAtOrder),
        0,
      ),
    );

    const order = await Order.create({
      userId: req.user.id,
      bookingId,
      status: ORDER_STATUS.PENDING,
      totalAmount,
    });

    await OrderItem.insertMany(
      normalizedItems.map((item) => ({
        orderId: order._id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        note: item.note,
        priceAtOrder: item.priceAtOrder,
      })),
    );

    await Invoice.create({
      orderIds: [order._id],
      totalAmount,
      remainingAmount: totalAmount,
      status: totalAmount > 0 ? "Pending" : "Paid",
    });

    res
      .status(201)
      .json({ message: "Tạo đơn hàng thành công.", orderId: order._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

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
    if (String(order.userId || "") !== String(req.user.id)) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    if (normalizeOrderStatus(order.status) !== ORDER_STATUS.PENDING) {
      return res.status(400).json({
        message: "Chỉ có thể cập nhật đơn hàng khi trạng thái là PENDING.",
      });
    }

    const menuIds = [...new Set(items.map((i) => i.menuItemId).filter(Boolean))];
    const menus = await MenuItem.find({ _id: { $in: menuIds } }).lean();
    const menuMap = new Map(menus.map((m) => [m._id.toString(), m]));

    const normalizedItems = [];
    for (const item of items) {
      const qty = Number(item.quantity || 0);
      if (!item.menuItemId || qty <= 0) continue;
      const menu = menuMap.get(String(item.menuItemId));
      if (!menu) continue;
      normalizedItems.push({
        menuItemId: menu._id,
        quantity: qty,
        note: item.note || "",
        priceAtOrder: Number(menu.price || 0),
      });
    }

    if (!normalizedItems.length) {
      return res.status(400).json({ message: "Danh sách món không hợp lệ." });
    }

    const oldTotalAmount = Number(order.totalAmount || 0);
    const newTotalAmount = Math.round(
      normalizedItems.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.priceAtOrder),
        0,
      ),
    );

    await OrderItem.deleteMany({ orderId: order._id });
    await OrderItem.insertMany(
      normalizedItems.map((item) => ({
        orderId: order._id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        note: item.note,
        priceAtOrder: item.priceAtOrder,
      })),
    );

    order.totalAmount = newTotalAmount;
    await order.save();

    const invoice = await Invoice.findOne({ orderIds: order._id });
    if (invoice) {
      const totalDiff = newTotalAmount - oldTotalAmount;
      invoice.totalAmount = Math.round(Number(invoice.totalAmount || 0) + totalDiff);

      const successPayments = await Payment.find({
        invoiceId: invoice._id,
        paymentStatus: "Success",
      }).lean();
      const totalPaid = successPayments.reduce(
        (sum, payment) => sum + Math.round(Number(payment.amount || 0)),
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

    res.json({ message: "Cập nhật đơn hàng thành công." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};
