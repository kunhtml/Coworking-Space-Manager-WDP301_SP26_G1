import Booking from "../models/booking.js";
import Table from "../models/table.js";
import Payment from "../models/payment.js";
import Invoice from "../models/invoice.js";

/**
 * GET /api/admin/analytics
 * Lấy dữ liệu phân tích công suất & sử dụng cho Admin Dashboard
 * Query params: period = "today" | "week" | "month"
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    const { period = "week" } = req.query;
    const now = new Date();

    // Xác định khoảng thời gian
    let startDate, endDate;
    let previousStartDate, previousEndDate;

    if (period === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      // Yesterday for comparison
      previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - 1);
      previousEndDate = new Date(endDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1);
    } else if (period === "week") {
      // This week (Monday - Sunday)
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);
      startDate = monday;
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      // Previous week
      previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - 7);
      previousEndDate = new Date(startDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1);
      previousEndDate.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      // Previous month
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else {
      // Default to week
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);
      startDate = monday;
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - 7);
      previousEndDate = new Date(startDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1);
      previousEndDate.setHours(23, 59, 59, 999);
    }

    // Lấy tất cả dữ liệu cần thiết
    const [tables, bookings, previousBookings, payments, invoices] = await Promise.all([
      Table.find().lean(),
      Booking.find({
        $or: [
          { startTime: { $gte: startDate, $lte: endDate } },
          { endTime: { $gte: startDate, $lte: endDate } },
          { startTime: { $lte: startDate }, endTime: { $gte: endDate } },
        ],
      }).populate("tableId").lean(),
      Booking.find({
        $or: [
          { startTime: { $gte: previousStartDate, $lte: previousEndDate } },
          { endTime: { $gte: previousStartDate, $lte: previousEndDate } },
        ],
      }).populate("tableId").lean(),
      Payment.find({
        paymentStatus: "Success",
        paidAt: { $gte: startDate, $lte: endDate },
      }).lean(),
      Invoice.find({
        status: "Paid",
        createdAt: { $gte: startDate, $lte: endDate },
      }).lean(),
    ]);

    const totalTables = tables.length;
    const totalBookings = bookings.length;
    const previousTotalBookings = previousBookings.length;

    // ===== 1. Tính tỷ lệ lấp đầy trung bình =====
    const operatingHoursPerDay = 12; // 7h - 19h = 12 giờ
    let daysInPeriod = 1;
    if (period === "week") {
      daysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 7;
    } else if (period === "month") {
      daysInPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    }

    const totalPossibleHours = totalTables * operatingHoursPerDay * daysInPeriod;
    
    // Tính tổng số giờ đã đặt
    let totalBookedHours = 0;
    let previousBookedHours = 0;

    const completedStatuses = ["Completed", "CheckedIn", "Confirmed", "In_Use"];

    bookings.forEach((booking) => {
      if (booking.startTime && booking.endTime) {
        const hours = (new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60);
        totalBookedHours += Math.max(0, hours);
      }
    });

    previousBookings.forEach((booking) => {
      if (booking.startTime && booking.endTime) {
        const hours = (new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60);
        previousBookedHours += Math.max(0, hours);
      }
    });

    const occupancyRate = totalPossibleHours > 0 
      ? Math.round((totalBookedHours / totalPossibleHours) * 100) 
      : 0;
    const previousOccupancyRate = totalPossibleHours > 0 
      ? Math.round((previousBookedHours / totalPossibleHours) * 100) 
      : 0;
    const occupancyChange = occupancyRate - previousOccupancyRate;

    // ===== 2. Thời gian sử dụng trung bình =====
    const avgBookingMinutes = totalBookings > 0 
      ? Math.round((totalBookedHours * 60) / totalBookings) 
      : 0;
    const previousAvgMinutes = previousTotalBookings > 0 
      ? Math.round((previousBookedHours * 60) / previousTotalBookings) 
      : 0;
    const avgTimeChange = avgBookingMinutes - previousAvgMinutes;

    const avgTimeHours = Math.floor(avgBookingMinutes / 60);
    const avgTimeMins = avgBookingMinutes % 60;
    const avgTimeFormatted = `${avgTimeHours}h ${avgTimeMins}p`;

    // ===== 3. Khung giờ cao điểm =====
    const hourlyUsage = {};
    for (let h = 7; h <= 19; h++) {
      hourlyUsage[h] = 0;
    }

    bookings.forEach((booking) => {
      if (booking.startTime && booking.endTime) {
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        for (let h = start.getHours(); h < end.getHours() && h <= 19; h++) {
          if (h >= 7) {
            hourlyUsage[h] = (hourlyUsage[h] || 0) + 1;
          }
        }
      }
    });

    // Tìm khung giờ cao điểm (3 giờ liên tiếp)
    let peakHourStart = 14;
    let peakHourEnd = 17;
    let maxUsage = 0;

    for (let h = 7; h <= 16; h++) {
      const threeHourUsage = (hourlyUsage[h] || 0) + (hourlyUsage[h + 1] || 0) + (hourlyUsage[h + 2] || 0);
      if (threeHourUsage > maxUsage) {
        maxUsage = threeHourUsage;
        peakHourStart = h;
        peakHourEnd = h + 3;
      }
    }

    // Tính % lấp đầy trong khung giờ cao điểm
    const peakHourBookings = bookings.filter((b) => {
      if (!b.startTime) return false;
      const hour = new Date(b.startTime).getHours();
      return hour >= peakHourStart && hour < peakHourEnd;
    }).length;
    
    const peakOccupancy = totalTables > 0 && daysInPeriod > 0
      ? Math.min(100, Math.round((peakHourBookings / (totalTables * daysInPeriod)) * 100))
      : 0;

    const peakHoursFormatted = `${String(peakHourStart).padStart(2, "0")}:00-${String(peakHourEnd).padStart(2, "0")}:00`;

    // ===== 4. Tỷ lệ No-show / Hủy =====
    const cancelledBookings = bookings.filter((b) => 
      b.status === "Cancelled" || b.status === "No_Show" || b.status === "NoShow"
    ).length;
    const previousCancelledBookings = previousBookings.filter((b) => 
      b.status === "Cancelled" || b.status === "No_Show" || b.status === "NoShow"
    ).length;

    const noShowRate = totalBookings > 0 
      ? Math.round((cancelledBookings / totalBookings) * 100 * 10) / 10 
      : 0;
    const previousNoShowRate = previousTotalBookings > 0 
      ? Math.round((previousCancelledBookings / previousTotalBookings) * 100 * 10) / 10 
      : 0;
    const noShowChange = Math.round((noShowRate - previousNoShowRate) * 10) / 10;

    // ===== 5. Công suất theo khung giờ (cho biểu đồ) =====
    const hourlyCapacity = [];
    for (let h = 7; h <= 19; h++) {
      const usage = totalTables > 0 && daysInPeriod > 0
        ? Math.min(100, Math.round(((hourlyUsage[h] || 0) / (totalTables * daysInPeriod)) * 100))
        : 0;
      hourlyCapacity.push({
        time: `${h}h`,
        hour: h,
        usage,
        bookings: hourlyUsage[h] || 0,
      });
    }

    // ===== 6. Heatmap data - theo bàn và giờ =====
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const heatmapGrid = tables.map((table) => {
      const tableName = table.name || `Bàn ${table._id.toString().slice(-4)}`;
      
      const hourlyData = hours.map((hour) => {
        const hourBookings = bookings.filter((b) => {
          if (!b.tableId) return false;
          const bookingTableId = b.tableId._id?.toString() || b.tableId.toString();
          if (bookingTableId !== table._id.toString()) return false;
          
          if (!b.startTime || !b.endTime) return false;
          const bookingStart = new Date(b.startTime);
          const bookingEnd = new Date(b.endTime);
          
          // Kiểm tra xem giờ này có nằm trong khoảng booking không
          return bookingStart.getHours() <= hour && bookingEnd.getHours() > hour;
        }).length;
        
        // Tính % usage dựa trên số ngày
        const usage = daysInPeriod > 0 ? Math.min(100, Math.round((hourBookings / daysInPeriod) * 100)) : 0;
        return usage;
      });
      
      return {
        tableId: table._id.toString(),
        tableName,
        tableType: table.tableType || "Unknown",
        hours: hourlyData,
      };
    });

    heatmapGrid.sort((a, b) => a.tableName.localeCompare(b.tableName, 'vi'));
    const heatmapLabels = hours.map(h => `${h}h`);

    // ===== 7. Top không gian được sử dụng nhiều nhất =====
    const tableUsageMap = new Map();

    bookings.forEach((booking) => {
      const tableId = booking.tableId?._id?.toString() || booking.tableId?.toString();
      if (!tableId) return;

      const existing = tableUsageMap.get(tableId) || {
        tableId,
        tableName: booking.tableId?.name || "N/A",
        tableType: booking.tableId?.tableType || "Khác",
        sessions: 0,
        totalMinutes: 0,
        revenue: 0,
      };

      existing.sessions += 1;

      if (booking.startTime && booking.endTime) {
        const minutes = (new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60);
        existing.totalMinutes += Math.max(0, minutes);
      }

      if (booking.depositAmount) {
        existing.revenue += Number(booking.depositAmount) || 0;
      }

      tableUsageMap.set(tableId, existing);
    });

    // Thêm doanh thu từ payments
    payments.forEach((payment) => {
      if (payment.bookingId) {
        const relatedBooking = bookings.find(
          (b) => b._id?.toString() === payment.bookingId?.toString()
        );
        if (relatedBooking && relatedBooking.tableId) {
          const tableId = relatedBooking.tableId._id?.toString() || relatedBooking.tableId.toString();
          const existing = tableUsageMap.get(tableId);
          if (existing) {
            existing.revenue += Number(payment.amount) || 0;
          }
        }
      }
    });

    const topSpaces = Array.from(tableUsageMap.values())
      .map((item) => {
        const totalHours = Math.round(item.totalMinutes / 60);
        const maxPossibleHours = operatingHoursPerDay * daysInPeriod;
        const usageRate = maxPossibleHours > 0 
          ? Math.min(100, Math.round((totalHours / maxPossibleHours) * 100))
          : 0;

        return {
          rank: 0,
          space: item.tableName,
          type: item.tableType,
          sessions: item.sessions,
          totalHours: `${totalHours}h`,
          totalMinutes: item.totalMinutes,
          revenue: new Intl.NumberFormat("vi-VN").format(item.revenue) + "đ",
          revenueRaw: item.revenue,
          usageRate,
        };
      })
      .sort((a, b) => b.sessions - a.sessions || b.revenueRaw - a.revenueRaw)
      .slice(0, 10)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    // ===== 8. Thống kê theo loại bàn =====
    const tableTypeStats = {};
    
    // Khởi tạo từ các loại bàn có trong tables
    const uniqueTableTypes = [...new Set(tables.map(t => t.tableType))];
    uniqueTableTypes.forEach(typeName => {
      if (typeName) {
        tableTypeStats[typeName] = {
          name: typeName,
          totalTables: 0,
          totalBookings: 0,
          totalHours: 0,
          revenue: 0,
        };
      }
    });

    // Đếm số bàn theo loại
    tables.forEach((table) => {
      const typeName = table.tableType || "Khác";
      if (tableTypeStats[typeName]) {
        tableTypeStats[typeName].totalTables += 1;
      }
    });

    // Đếm bookings theo loại bàn
    bookings.forEach((booking) => {
      const typeName = booking.tableId?.tableType || "Khác";
      if (tableTypeStats[typeName]) {
        tableTypeStats[typeName].totalBookings += 1;
        if (booking.startTime && booking.endTime) {
          const hours = (new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60);
          tableTypeStats[typeName].totalHours += Math.max(0, hours);
        }
        tableTypeStats[typeName].revenue += Number(booking.depositAmount) || 0;
      }
    });

    const tableTypeUsage = Object.values(tableTypeStats)
      .filter((t) => t.totalTables > 0 || t.totalBookings > 0)
      .sort((a, b) => b.totalBookings - a.totalBookings);

    // ===== 9. Tính tổng doanh thu =====
    let totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    // Nếu không có payments, tính từ invoices
    if (totalRevenue === 0 && invoices.length > 0) {
      totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    }
    
    // Nếu vẫn không có, tính từ bookings
    if (totalRevenue === 0) {
      totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.depositAmount) || 0), 0);
    }

    // ===== Response =====
    res.json({
      period,
      startDate,
      endDate,
      generatedAt: now,

      metrics: {
        occupancy: occupancyRate,
        occupancyChange,
        avgTime: avgTimeFormatted,
        avgTimeMinutes: avgBookingMinutes,
        avgTimeChange,
        peakHours: peakHoursFormatted,
        peakOccupancy,
        noShowRate,
        noShowChange,
      },

      hourlyCapacity,
      heatmapGrid,
      heatmapLabels,
      topSpaces,
      tableTypeUsage,

      summary: {
        totalTables,
        totalBookings,
        totalBookedHours: Math.round(totalBookedHours),
        totalRevenue,
        daysInPeriod,
      },
    });
  } catch (err) {
    console.error("❌ Admin Analytics error:", err);
    res.status(500).json({ message: "Lỗi khi tải dữ liệu phân tích." });
  }
};
