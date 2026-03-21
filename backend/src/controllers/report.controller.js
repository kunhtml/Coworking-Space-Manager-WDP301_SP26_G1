import Payment from "../models/payment.js";
import Booking from "../models/booking.js";
import Table from "../models/table.js";
import Order from "../models/order.js";
import Invoice from "../models/invoice.js";

export const getReportAnalytics = async (req, res) => {
  try {
    console.log("🔍 Report Analytics called with query:", req.query);
    const { timeFilter = "Ngày" } = req.query;
    console.log("📊 Analytics request with timeFilter:", timeFilter);

    const [payments, bookings, tables, orders, invoices] = await Promise.all([
      Payment.find().sort({ paidAt: -1, createdAt: -1 }).lean(),
      Booking.find()
        .populate("tableId", "name tableType capacity status")
        .sort({ createdAt: -1 })
        .lean(),
      Table.find().sort({ name: 1 }).lean(),
      Order.find().sort({ createdAt: -1 }).lean(),
      Invoice.find().sort({ createdAt: -1 }).lean(),
    ]);

    const now = new Date();
    let revenueData = [];
    let periodLabel = "";

    // 🎯 Generate different time periods based on filter
    if (timeFilter === "Ngày") {
      periodLabel = "ngày";
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
        revenueData.push({ _id: key, total: 0, count: 0 });
      }
    } else if (timeFilter === "Tuần") {
      periodLabel = "tuần";
      // Last 8 weeks
      for (let i = 7; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i * 7);
        const weekStart = new Date(
          date.setDate(date.getDate() - date.getDay()),
        );
        const key = `T${Math.ceil(weekStart.getDate() / 7)}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
        revenueData.push({ _id: key, total: 0, count: 0 });
      }
    } else if (timeFilter === "Tháng") {
      periodLabel = "tháng";
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
        revenueData.push({ _id: key, total: 0, count: 0 });
      }
    } else if (timeFilter === "Năm") {
      periodLabel = "năm";
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        revenueData.push({ _id: String(year), total: 0, count: 0 });
      }
    }

    // 💰 Aggregate payment data based on time filter
    const successfulPayments = payments.filter(
      (p) => p.paymentStatus === "Success",
    );
    const totalRevenue = successfulPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    );
    const depositRevenue = successfulPayments
      .filter((p) => p.type === "Deposit")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const otherRevenue = totalRevenue - depositRevenue;

    // Group payments by time period
    successfulPayments.forEach((payment) => {
      const paidDate = new Date(payment.paidAt || payment.createdAt || now);
      let periodKey = "";

      if (timeFilter === "Ngày") {
        periodKey = `${String(paidDate.getDate()).padStart(2, "0")}/${String(paidDate.getMonth() + 1).padStart(2, "0")}`;
      } else if (timeFilter === "Tuần") {
        const weekStart = new Date(
          paidDate.setDate(paidDate.getDate() - paidDate.getDay()),
        );
        periodKey = `T${Math.ceil(weekStart.getDate() / 7)}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
      } else if (timeFilter === "Tháng") {
        periodKey = `${String(paidDate.getMonth() + 1).padStart(2, "0")}/${paidDate.getFullYear()}`;
      } else if (timeFilter === "Năm") {
        periodKey = String(paidDate.getFullYear());
      }

      const period = revenueData.find((p) => p._id === periodKey);
      if (period) {
        period.total += Number(payment.amount) || 0;
        period.count += 1;
      }
    });

    // 📊 Generate occupancy data by time period
    let occupancyData = [];

    // Initialize occupancy periods with same structure as revenueData
    if (timeFilter === "Ngày") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
        occupancyData.push({ _id: key, occupancyRate: 0, bookingCount: 0 });
      }
    } else if (timeFilter === "Tuần") {
      for (let i = 7; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i * 7);
        const weekStart = new Date(
          date.setDate(date.getDate() - date.getDay()),
        );
        const key = `T${Math.ceil(weekStart.getDate() / 7)}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
        occupancyData.push({ _id: key, occupancyRate: 0, bookingCount: 0 });
      }
    } else if (timeFilter === "Tháng") {
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
        occupancyData.push({ _id: key, occupancyRate: 0, bookingCount: 0 });
      }
    } else if (timeFilter === "Năm") {
      // 🎯 Only show current year, not historical years without data
      const currentYear = now.getFullYear();
      occupancyData.push({
        _id: String(currentYear),
        occupancyRate: 0,
        bookingCount: 0,
      });

      // Only add previous years if there are actual bookings in those years
      const yearsWithBookings = new Set();
      bookings.forEach((booking) => {
        if (booking.startTime) {
          const bookingYear = new Date(booking.startTime).getFullYear();
          if (bookingYear < currentYear && bookingYear >= currentYear - 4) {
            yearsWithBookings.add(bookingYear);
          }
        }
      });

      // Add years with actual bookings, sorted
      Array.from(yearsWithBookings)
        .sort((a, b) => a - b)
        .forEach((year) => {
          if (!occupancyData.find((d) => d._id === String(year))) {
            occupancyData.unshift({
              _id: String(year),
              occupancyRate: 0,
              bookingCount: 0,
            });
          }
        });
    }

    // Calculate occupancy rates based on bookings
    const totalCapacity = tables.reduce(
      (sum, table) => sum + (table.capacity || 0),
      0,
    );

    bookings.forEach((booking) => {
      if (!booking.startTime) return;

      const bookingDate = new Date(booking.startTime);
      let periodKey = "";

      if (timeFilter === "Ngày") {
        periodKey = `${String(bookingDate.getDate()).padStart(2, "0")}/${String(bookingDate.getMonth() + 1).padStart(2, "0")}`;
      } else if (timeFilter === "Tuần") {
        const weekStart = new Date(
          bookingDate.setDate(bookingDate.getDate() - bookingDate.getDay()),
        );
        periodKey = `T${Math.ceil(weekStart.getDate() / 7)}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
      } else if (timeFilter === "Tháng") {
        periodKey = `${String(bookingDate.getMonth() + 1).padStart(2, "0")}/${bookingDate.getFullYear()}`;
      } else if (timeFilter === "Năm") {
        periodKey = String(bookingDate.getFullYear());
      }

      const period = occupancyData.find((p) => p._id === periodKey);
      if (period) {
        period.bookingCount += 1;
        // Calculate occupancy as percentage of table capacity usage
        const tableCapacity = booking.tableId?.capacity || 1;
        period.occupancyRate += (tableCapacity / totalCapacity) * 100;
      }
    });

    // Normalize occupancy rates (ensure reasonable percentages)
    occupancyData.forEach((period) => {
      if (period.bookingCount > 0) {
        // Cap at 100% and ensure minimum realistic rates
        period.occupancyRate = Math.min(
          100,
          Math.max(1, Math.round(period.occupancyRate)),
        );
      } else {
        // No bookings = 0% occupancy (no fake data)
        period.occupancyRate = 0;
      }
    });

    const bookingsByStatusMap = bookings.reduce((acc, booking) => {
      const status = booking.status || "Unknown";
      acc.set(status, (acc.get(status) || 0) + 1);
      return acc;
    }, new Map());

    const occupancyByStatusMap = tables.reduce((acc, table) => {
      const status = table.status || "Unknown";
      acc.set(status, (acc.get(status) || 0) + 1);
      return acc;
    }, new Map());

    const tableTypeUsageMap = bookings.reduce((acc, booking) => {
      const type = booking.tableId?.tableType || "Unknown";
      const existing = acc.get(type) || {
        tableType: type,
        bookings: 0,
        guests: 0,
      };
      existing.bookings += 1;
      existing.guests += Number(booking.tableId?.capacity) || 0;
      acc.set(type, existing);
      return acc;
    }, new Map());

    const totalTables = tables.length;
    const occupiedTables = occupancyByStatusMap.get("Occupied") || 0;
    const availableTables = occupancyByStatusMap.get("Available") || 0;
    const maintenanceTables = occupancyByStatusMap.get("Maintenance") || 0;
    const activeBookings = bookings.filter(
      (booking) => booking.status === "In_Use",
    ).length;

    res.json({
      generatedAt: now,
      timeFilter,
      periodLabel,
      summary: {
        totalRevenue,
        depositRevenue,
        otherRevenue,
        totalBookings: bookings.length,
        activeBookings,
        totalTables,
        availableTables,
        occupiedTables,
        maintenanceTables,
        occupancyRate: totalTables
          ? Math.round((occupiedTables / totalTables) * 100)
          : 0,
        totalOrders: orders.length,
        totalOrderRevenue: orders.reduce(
          (sum, order) => sum + (Number(order.totalAmount) || 0),
          0,
        ),
        totalInvoices: invoices.length,
        invoicedRevenue: invoices.reduce(
          (sum, invoice) => sum + (Number(invoice.totalAmount) || 0),
          0,
        ),
      },
      revenueByMonth: revenueData, // 🎯 Dynamic time periods
      occupancyByPeriod: occupancyData, // 📊 Dynamic occupancy data
      bookingsByStatus: Array.from(bookingsByStatusMap.entries()).map(
        ([status, count]) => ({ status, count }),
      ),
      occupancyByStatus: Array.from(occupancyByStatusMap.entries()).map(
        ([status, count]) => ({ status, count }),
      ),
      tableTypeUsage: Array.from(tableTypeUsageMap.values()).sort(
        (a, b) => b.bookings - a.bookings,
      ),
      recentPayments: successfulPayments.slice(0, 5).map((payment) => ({
        id: payment._id,
        amount: payment.amount || 0,
        type: payment.type || "Payment",
        method: payment.paymentMethod || "N/A",
        paidAt: payment.paidAt || payment.createdAt || null,
      })),
      recentBookings: bookings.slice(0, 5).map((booking) => ({
        id: booking._id,
        bookingCode: booking.bookingCode,
        tableName: booking.tableId?.name || "N/A",
        tableType: booking.tableId?.tableType || "N/A",
        status: booking.status || "Unknown",
        startTime: booking.startTime,
        depositAmount: booking.depositAmount || 0,
      })),
    });
  } catch (err) {
    console.error("❌ Analytics error:", err);
    res.status(500).json({ message: "Lỗi khi tải báo cáo tổng quan." });
  }
};

// POST /api/bookings  (Customer - create booking)
