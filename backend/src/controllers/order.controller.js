import Booking from "../models/booking.js";
import Order from "../models/order.js";
import OrderItem from "../models/order_item.js";
import MenuItem from "../models/menu_item.js";
import Invoice from "../models/invoice.js";
import Payment from "../models/payment.js";
import { ORDER_STATUS, normalizeOrderStatus } from "../constants/domain.js";

const BLOCKED_BOOKING_STATUSES = new Set(["Cancelled", "Canceled"]);

function mapOrderRow(order, bookingMap, itemMap, invoiceMap) {
  const booking = bookingMap.get(order.bookingId?.toString());
  const invoice = invoiceMap.get(order._id?.toString());
  const normalizedOrderStatus = normalizeOrderStatus(order.status);
  const normalizedInvoiceStatus = String(invoice?.status || "").toUpperCase();

  let paymentStatus = "UNPAID";
  if (normalizedOrderStatus === ORDER_STATUS.CANCELLED) {
    paymentStatus = "CANCELLED";
  } else if (
    normalizedInvoiceStatus === "PAID" ||
    Number(invoice?.remainingAmount || 0) <= 0
  ) {
    paymentStatus = "PAID";
  }

  const appendOnlyEdit =
    paymentStatus === "PAID" || normalizedInvoiceStatus === "PARTIALLY_PAID";

  return {
    id: order._id,
    bookingId: order.bookingId,
    status: normalizedOrderStatus,
    paymentStatus,
    appendOnlyEdit,
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

    const [items, bookings, invoices] = await Promise.all([
      OrderItem.find({ orderId: { $in: orderIds } }).lean(),
      Booking.find({ _id: { $in: bookingIds } }).lean(),
      Invoice.find({ orderIds: { $in: orderIds } })
        .select("orderIds status remainingAmount")
        .lean(),
    ]);

    const menuIds = [
      ...new Set(items.map((i) => i.menuItemId?.toString()).filter(Boolean)),
    ];
    const menus = await MenuItem.find({ _id: { $in: menuIds } }).lean();

    const bookingMap = new Map(bookings.map((b) => [b._id.toString(), b]));
    const invoiceMap = new Map();
    for (const invoice of invoices) {
      for (const orderId of invoice.orderIds || []) {
        invoiceMap.set(orderId.toString(), invoice);
      }
    }
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

    res.json(
      orders.map((o) => mapOrderRow(o, bookingMap, itemMap, invoiceMap)),
    );
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

    const menuIds = [
      ...new Set(items.map((i) => i.menuItemId).filter(Boolean)),
    ];
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
    const { items, appendOnly } = req.body;
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

    const menuIds = [
      ...new Set(items.map((i) => i.menuItemId).filter(Boolean)),
    ];
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

    const invoice = await Invoice.findOne({ orderIds: order._id });
    const successPayments = invoice
      ? await Payment.find({
          invoiceId: invoice._id,
          paymentStatus: "Success",
        }).lean()
      : [];
    const totalPaid = successPayments.reduce(
      (sum, payment) => sum + Math.round(Number(payment.amount || 0)),
      0,
    );
    const hasPaidAmount = totalPaid > 0;

    const oldTotalAmount = Number(order.totalAmount || 0);

    if (hasPaidAmount) {
      const existingItems = await OrderItem.find({ orderId: order._id }).lean();

      const makeKey = (item) =>
        `${String(item.menuItemId)}|${String(item.note || "").trim()}|${Number(item.priceAtOrder || 0)}`;

      const existingQtyByKey = new Map();
      for (const item of existingItems) {
        const key = makeKey(item);
        existingQtyByKey.set(
          key,
          Number(existingQtyByKey.get(key) || 0) + Number(item.quantity || 0),
        );
      }

      const incomingByKey = new Map();
      const incomingMetaByKey = new Map();
      for (const item of normalizedItems) {
        const key = makeKey(item);
        incomingByKey.set(
          key,
          Number(incomingByKey.get(key) || 0) + Number(item.quantity || 0),
        );
        if (!incomingMetaByKey.has(key)) {
          incomingMetaByKey.set(key, item);
        }
      }

      const newlyAddedItems = [];
      if (appendOnly) {
        newlyAddedItems.push(...normalizedItems);
      } else {
        for (const [key, incomingQty] of incomingByKey.entries()) {
          const oldQty = Number(existingQtyByKey.get(key) || 0);
          const deltaQty = incomingQty - oldQty;
          if (deltaQty > 0) {
            const itemMeta = incomingMetaByKey.get(key);
            newlyAddedItems.push({
              menuItemId: itemMeta.menuItemId,
              quantity: deltaQty,
              note: itemMeta.note || "",
              priceAtOrder: Number(itemMeta.priceAtOrder || 0),
            });
          }
        }
      }

      if (!newlyAddedItems.length) {
        return res.status(400).json({
          message:
            "Đơn đã có thanh toán. Bạn chỉ có thể thêm món mới, không thể sửa/xóa món đã thanh toán.",
        });
      }

      await OrderItem.insertMany(
        newlyAddedItems.map((item) => ({
          orderId: order._id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          note: item.note,
          priceAtOrder: item.priceAtOrder,
        })),
      );

      const addedAmount = Math.round(
        newlyAddedItems.reduce(
          (sum, item) =>
            sum + Number(item.quantity) * Number(item.priceAtOrder),
          0,
        ),
      );

      order.totalAmount = Math.round(oldTotalAmount + addedAmount);
      await order.save();

      if (invoice) {
        invoice.totalAmount = Math.round(
          Number(invoice.totalAmount || 0) + addedAmount,
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

      return res.json({
        message: "Đã thêm món mới vào đơn hàng thành công.",
        appendOnly: Boolean(appendOnly),
      });
    }

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

    if (invoice) {
      const totalDiff = newTotalAmount - oldTotalAmount;
      invoice.totalAmount = Math.round(
        Number(invoice.totalAmount || 0) + totalDiff,
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
