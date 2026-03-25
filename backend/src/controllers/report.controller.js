import Payment from "../models/payment.js";
import Booking from "../models/booking.js";
import Table from "../models/table.js";
import Order from "../models/order.js";
import Invoice from "../models/invoice.js";
import TableType from "../models/tableType.js";

const buildTableTypeMetaMap = async (tables = []) => {
  const typeIds = [
    ...new Set(
      tables.map((table) => table.tableTypeId?.toString()).filter(Boolean),
    ),
  ];
  if (!typeIds.length) return new Map();

  const tableTypes = await TableType.find({ _id: { $in: typeIds } }).lean();
  return new Map(
    tableTypes.map((type) => [
      type._id.toString(),
      {
        name: String(type.name || ""),
        capacity: Number(type.capacity || 0),
      },
    ]),
  );
};

const resolveTableTypeMeta = (table, tableTypeMetaMap) =>
  tableTypeMetaMap.get(table?.tableTypeId?.toString()) || null;

const resolveTableCapacity = (table, tableTypeMetaMap) =>
  Number(resolveTableTypeMeta(table, tableTypeMetaMap)?.capacity || 0);

const resolveTableTypeName = (table, tableTypeMetaMap) =>
  resolveTableTypeMeta(table, tableTypeMetaMap)?.name || "Unknown";

export const getReportAnalytics = async (req, res) => {
  try {
    const { timeFilter = "Ngày" } = req.query;
    console.log("📊 Analytics request with timeFilter:", timeFilter);

    const [payments, bookings, tables, orders, invoices] = await Promise.all([
      Payment.find().sort({ paidAt: -1, createdAt: -1 }).lean(),
      Booking.find()
        .populate("tableId", "name tableTypeId status")
        .sort({ createdAt: -1 })
        .lean(),
      Table.find().sort({ name: 1 }).lean(),
      Order.find().sort({ createdAt: -1 }).lean(),
      Invoice.find().sort({ createdAt: -1 }).lean(),
    ]);
    const tableTypeMetaMap = await buildTableTypeMetaMap(tables);

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
      (sum, table) => sum + resolveTableCapacity(table, tableTypeMetaMap),
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
        const tableCapacity = resolveTableCapacity(
          booking.tableId,
          tableTypeMetaMap,
        );
        if (totalCapacity > 0) {
          period.occupancyRate += (tableCapacity / totalCapacity) * 100;
        }
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
      const type = resolveTableTypeName(booking.tableId, tableTypeMetaMap);
      const existing = acc.get(type) || {
        tableType: type,
        bookings: 0,
        guests: 0,
      };
      existing.bookings += 1;
      existing.guests += resolveTableCapacity(
        booking.tableId,
        tableTypeMetaMap,
      );
      acc.set(type, existing);
      return acc;
    }, new Map());

    const totalTables = tables.length;
    const occupiedTables = occupancyByStatusMap.get("Occupied") || 0;
    const availableTables = occupancyByStatusMap.get("Available") || 0;
    const maintenanceTables = occupancyByStatusMap.get("Maintenance") || 0;
    const activeBookings = bookings.filter((booking) =>
      ["CheckedIn", "In_Use"].includes(booking.status),
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
        tableType: resolveTableTypeName(booking.tableId, tableTypeMetaMap),
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

export const getHourlyOccupancyAnalytics = async (req, res) => {
  try {
    const { date, period = "day" } = req.query;
    const openingHour = 7;
    const closingHour = 19;

    const parseLocalDate = (ymd) => {
      const [y, m, d] = String(ymd).split("-").map(Number);
      if (!y || !m || !d) return null;
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    };

    const baseDate = date ? parseLocalDate(date) : new Date();
    if (!baseDate || Number.isNaN(baseDate.getTime())) {
      return res
        .status(400)
        .json({ message: "Ngay khong hop le (YYYY-MM-DD)." });
    }

    const dayStart = new Date(baseDate);
    dayStart.setHours(0, 0, 0, 0);

    const rangeStart = new Date(dayStart);
    const rangeEnd = new Date(dayStart);
    let dayCount = 1;

    if (period === "week") {
      rangeStart.setDate(rangeStart.getDate() - 6);
      rangeEnd.setDate(rangeEnd.getDate() + 1);
      dayCount = 7;
    } else if (period === "month") {
      rangeStart.setDate(1);
      rangeEnd.setMonth(rangeEnd.getMonth() + 1, 1);
      dayCount = Math.max(
        1,
        Math.round(
          (rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000),
        ),
      );
    } else {
      rangeEnd.setDate(rangeEnd.getDate() + 1);
      dayCount = 1;
    }

    const [tables, bookings] = await Promise.all([
      Table.find().lean(),
      Booking.find({
        startTime: { $lt: rangeEnd },
        endTime: { $gt: rangeStart },
        status: { $nin: ["Cancelled", "No_Show", "NoShow", "Rejected"] },
      })
        .populate("tableId", "tableTypeId")
        .lean(),
    ]);

    const tableTypeMetaMap = await buildTableTypeMetaMap(tables);

    const tableCapacityById = new Map(
      tables.map((table) => [
        String(table._id),
        resolveTableCapacity(table, tableTypeMetaMap),
      ]),
    );

    const totalCapacity = tables.reduce(
      (sum, table) => sum + resolveTableCapacity(table, tableTypeMetaMap),
      0,
    );

    const hourlyAccumulator = Array.from(
      { length: closingHour - openingHour },
      (_, index) => ({
        hour: openingHour + index,
        occupiedCapacitySum: 0,
        bookingCount: 0,
      }),
    );

    for (let dayOffset = 0; dayOffset < dayCount; dayOffset += 1) {
      const currentDayStart = new Date(rangeStart);
      currentDayStart.setDate(rangeStart.getDate() + dayOffset);

      for (let hour = openingHour; hour < closingHour; hour += 1) {
        const slotStart = new Date(currentDayStart);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(currentDayStart);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        const overlappingBookings = bookings.filter((booking) => {
          if (!booking.startTime || !booking.endTime) return false;
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);
          return bookingStart < slotEnd && bookingEnd > slotStart;
        });

        const occupiedTableIds = new Set();
        let occupiedCapacity = 0;

        overlappingBookings.forEach((booking) => {
          const tableId = booking.tableId?._id
            ? String(booking.tableId._id)
            : booking.tableId
              ? String(booking.tableId)
              : null;

          if (tableId && !occupiedTableIds.has(tableId)) {
            occupiedTableIds.add(tableId);
            occupiedCapacity += tableCapacityById.get(tableId) || 0;
          }
        });

        const accumulator = hourlyAccumulator[hour - openingHour];
        accumulator.occupiedCapacitySum += occupiedCapacity;
        accumulator.bookingCount += overlappingBookings.length;
      }
    }

    const hourlyCapacity = hourlyAccumulator.map((item) => {
      const usage = totalCapacity
        ? Math.min(
            100,
            item.occupiedCapacitySum > 0
              ? Math.max(
                  1,
                  Math.round(
                    (item.occupiedCapacitySum /
                      (totalCapacity * Math.max(dayCount, 1))) *
                      100,
                  ),
                )
              : 0,
          )
        : 0;

      return {
        hour: item.hour,
        time: `${item.hour}h`,
        usage,
        occupiedCapacity:
          dayCount > 0 ? Math.round(item.occupiedCapacitySum / dayCount) : 0,
        totalCapacity,
        bookingCount: item.bookingCount,
      };
    });

    const peak = hourlyCapacity.reduce(
      (max, item) => (item.usage > max.usage ? item : max),
      { hour: openingHour, usage: 0 },
    );

    const peakWindow = {
      startHour: peak.hour,
      endHour: peak.hour + 1,
      maxUsage: peak.usage,
      label: `${String(peak.hour).padStart(2, "0")}:00 - ${String(
        peak.hour + 1,
      ).padStart(2, "0")}:00 (${peak.usage}% lap day)`,
    };

    return res.json({
      date: `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, "0")}-${String(dayStart.getDate()).padStart(2, "0")}`,
      period,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      dayCount,
      openingHour,
      closingHour,
      totalCapacity,
      hourlyCapacity,
      peakWindow,
    });
  } catch (err) {
    console.error("Hourly analytics error:", err);
    return res
      .status(500)
      .json({ message: "Loi khi tai du lieu cong suat theo gio." });
  }
};

// Get daily table usage count for a month
// Daily table usage analytics API - v2024-03-23
export const getDailyTableUsage = async (req, res) => {
  console.log("[getDailyTableUsage] API called with query:", req.query);
  try {
    const { year, month } = req.query;

    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

    // Get first and last day of the month
    const monthStart = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth + 1, 1, 0, 0, 0, 0);

    // Get all tables and create a map for quick lookup
    const tables = await Table.find().lean();
    const tableTypeMetaMap = await buildTableTypeMetaMap(tables);
    const totalTables = tables.length;
    const tablesMap = new Map();
    tables.forEach((t) => tablesMap.set(String(t._id), t));

    // Get all bookings for the month
    const bookings = await Booking.find({
      startTime: { $lt: monthEnd },
      endTime: { $gt: monthStart },
      status: { $nin: ["Cancelled", "No_Show", "NoShow", "Rejected"] },
    })
      .populate("tableId", "_id name tableTypeId pricePerHour")
      .populate("userId", "_id name email phone")
      .lean();

    // Calculate table usage for each day
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const dailyUsage = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(targetYear, targetMonth, day, 0, 0, 0, 0);
      const dayEnd = new Date(targetYear, targetMonth, day, 23, 59, 59, 999);

      // Check if this day is in the future
      const isFutureDay = dayStart > today;

      // Find bookings that overlap with this day
      const dayBookings = bookings.filter((booking) => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        return bookingStart < dayEnd && bookingEnd > dayStart;
      });

      // Count unique tables used on this day and collect table details
      const uniqueTablesMap = new Map();
      const bookingsWithoutTable = [];

      dayBookings.forEach((booking) => {
        // Handle both populated tableId (object) and non-populated (ObjectId/string)
        let tableIdStr = null;
        let tableData = null;

        if (booking.tableId) {
          if (booking.tableId._id) {
            // tableId was populated successfully
            tableIdStr = String(booking.tableId._id);
            tableData = booking.tableId;
          } else {
            // tableId is ObjectId or string (not populated - table might be deleted)
            tableIdStr = String(booking.tableId);
            // Try to find table in our map
            tableData = tablesMap.get(tableIdStr);
          }
        }

        if (tableIdStr && tableData) {
          if (!uniqueTablesMap.has(tableIdStr)) {
            uniqueTablesMap.set(tableIdStr, {
              _id: tableData._id,
              name: tableData.name,
              capacity: resolveTableCapacity(tableData, tableTypeMetaMap),
              pricePerHour: tableData.pricePerHour,
              bookings: [],
            });
          }
          // Add booking info to this table
          uniqueTablesMap.get(tableIdStr).bookings.push({
            _id: booking._id,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            totalPrice: booking.totalPrice,
            user: booking.userId
              ? {
                  _id: booking.userId._id,
                  name: booking.userId.name,
                  email: booking.userId.email,
                  phone: booking.userId.phone,
                }
              : null,
          });
        } else {
          // Booking without valid tableId (table deleted or never assigned)
          bookingsWithoutTable.push({
            _id: booking._id,
            tableIdRaw: booking.tableId, // for debugging
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            totalPrice: booking.totalPrice,
            user: booking.userId
              ? {
                  _id: booking.userId._id,
                  name: booking.userId.name,
                  email: booking.userId.email,
                  phone: booking.userId.phone,
                }
              : null,
          });
        }
      });

      const tablesUsed = uniqueTablesMap.size;
      const occupancyRate =
        totalTables > 0 ? Math.round((tablesUsed / totalTables) * 100) : 0;

      // Debug log for days with bookings
      if (dayBookings.length > 0 && day <= 10) {
        console.log(
          `[DEBUG] Day ${day}: ${dayBookings.length} bookings, ${uniqueTablesMap.size} tables, ${bookingsWithoutTable.length} without table`,
        );
        if (uniqueTablesMap.size === 0 && dayBookings.length > 0) {
          console.log(
            `  Sample booking:`,
            JSON.stringify(dayBookings[0], null, 2),
          );
        }
      }

      dailyUsage[day] = {
        tablesUsed,
        totalTables,
        occupancyRate,
        bookingCount: dayBookings.length,
        tables: Array.from(uniqueTablesMap.values()),
        bookingsWithoutTable,
        isFutureDay,
      };
    }

    return res.json({
      year: targetYear,
      month: targetMonth + 1,
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      totalTables,
      daysInMonth,
      dailyUsage,
    });
  } catch (err) {
    console.error("[getDailyTableUsage] ERROR:", err);
    console.error(err.stack);
    return res
      .status(500)
      .json({ message: "Loi khi tai du lieu su dung ban theo ngay." });
  }
};

// POST /api/bookings  (Customer - create booking)
