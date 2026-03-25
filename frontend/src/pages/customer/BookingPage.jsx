import { useEffect, useState } from "react";
import {
  Alert,
  Container,
  Row,
  Col,
  Button,
} from "react-bootstrap";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import GuestCustomerNavbar from "../../components/common/GuestCustomerNavbar";
import BookingHeroSection from "../../components/customer/cards/BookingHeroSection";
import WorkspaceTypeSelectorCard from "../../components/customer/cards/WorkspaceTypeSelectorCard";
import BookingTimeFormCard from "../../components/customer/forms/BookingTimeFormCard";
import AvailableTablesCard from "../../components/customer/cards/AvailableTablesCard";
import BookingSummaryCard from "../../components/customer/cards/BookingSummaryCard";
import BookingConfirmationModal from "../../components/customer/modals/BookingConfirmationModal";
import {
  searchAvailableTables,
  createBookingApi,
} from "../../services/bookingService";
import { apiClient } from "../../services/api";

export function meta() {
  return [
    { title: "Đặt chỗ ngồi | Coworking Space" },
    {
      name: "description",
      content:
        "Đặt chỗ ngồi online tại Coworking Space. Chọn thời gian, loại chỗ ngồi phù hợp cho việc học tập và làm việc.",
    },
  ];
}

const TYPE_COLORS = [
  { color: "rgba(99, 102, 241, 0.1)", borderColor: "#6366f1" },
  { color: "rgba(34, 197, 94, 0.1)", borderColor: "#22c55e" },
  { color: "rgba(59, 130, 246, 0.1)", borderColor: "#3b82f6" },
  { color: "rgba(251, 191, 36, 0.1)", borderColor: "#fbbf24" },
  { color: "rgba(244, 63, 94, 0.1)", borderColor: "#f43f5e" },
];

function formatTypeTitle(type) {
  if (!type) return "Không xác định";
  return String(type)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function pickIcon(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("meeting") || t.includes("room")) return "bi-easel";
  if (t.includes("group")) return "bi-people-fill";
  if (t.includes("vip") || t.includes("private")) return "bi-gem";
  return "bi-person-workspace";
}

export default function BookingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeStart, setSelectedTimeStart] = useState("");
  const [selectedTimeEnd, setSelectedTimeEnd] = useState("");
  const [workspaceTypes, setWorkspaceTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Initialize date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
  }, []);

  // Auto-adjust end time minimum 1 hour after start time
  useEffect(() => {
    if (selectedTimeStart) {
      const [sh, sm] = selectedTimeStart.split(":").map(Number);
      let eh = sh + 1;
      let em = sm;
      if (eh > 23) eh = 23; // Cap at 23:xx
      
      const defaultEnd = `${eh.toString().padStart(2, "0")}:${em.toString().padStart(2, "0")}`;
      
      if (!selectedTimeEnd) {
        setSelectedTimeEnd(defaultEnd);
      } else {
        const [ceh, cem] = selectedTimeEnd.split(":").map(Number);
        const diffMinutes = (ceh * 60 + cem) - (sh * 60 + sm);
        if (diffMinutes < 60 && sh !== 23) {
          setSelectedTimeEnd(defaultEnd);
        }
      }
    }
  }, [selectedTimeStart]); // ONLY run when start time changes

  useEffect(() => {
    const loadWorkspaceTypes = async () => {
      setLoadingTypes(true);
      try {
        const tables = await apiClient.get("/tables");
        const grouped = new Map();

        for (const t of tables || []) {
          const typeKey = String(t.tableType || "Khác");
          const existing = grouped.get(typeKey) || {
            id: typeKey,
            title: formatTypeTitle(typeKey),
            description: `Loại chỗ: ${formatTypeTitle(typeKey)}`,
            price: Number.POSITIVE_INFINITY,
            capacity: 0,
            features: ["Wi-Fi", "Ổ cắm"],
            icon: pickIcon(typeKey),
            color: TYPE_COLORS[grouped.size % TYPE_COLORS.length].color,
            borderColor:
              TYPE_COLORS[grouped.size % TYPE_COLORS.length].borderColor,
            popular: false,
            count: 0,
          };

          existing.price = Math.min(
            existing.price,
            Number(t.pricePerHour || 0),
          );
          existing.capacity = Math.max(
            existing.capacity,
            Number(t.capacity || 0),
          );
          existing.count += 1;
          grouped.set(typeKey, existing);
        }

        const rows = Array.from(grouped.values())
          .sort((a, b) => b.count - a.count)
          .map((t, idx) => ({
            ...t,
            popular: idx === 0,
            capacity: `${t.capacity || 1} chỗ`,
            price: Number.isFinite(t.price) ? t.price : 0,
          }));

        setWorkspaceTypes(rows);
      } catch (err) {
        setError(err.message || "Không thể tải loại chỗ ngồi từ hệ thống.");
      } finally {
        setLoadingTypes(false);
      }
    };

    loadWorkspaceTypes();
  }, []);

  const handleSearch = async () => {
    if (
      !selectedType ||
      !selectedDate ||
      !selectedTimeStart ||
      !selectedTimeEnd
    ) {
      setError("Vui lòng chọn đầy đủ thông tin để tìm chỗ ngồi");
      return;
    }

    const startDateTime = new Date(`${selectedDate}T${selectedTimeStart}:00`);
    const now = new Date();
    if (startDateTime.getTime() - now.getTime() < 10 * 60 * 1000) {
      setError("Giờ bắt đầu đặt bàn phải diễn ra sau thời điểm hiện tại ít nhất 10 phút.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const searchParams = {
        date: selectedDate,
        startTime: selectedTimeStart,
        endTime: selectedTimeEnd,
        tableType: selectedType,
      };

      const tables = await searchAvailableTables(searchParams);
      setAvailableTables(tables);

      if (tables.length === 0) {
        setError(
          "Không tìm thấy chỗ ngồi trống trong thời gian này. Vui lòng chọn thời gian khác.",
        );
      }
    } catch (err) {
      setError(err.message || "Lỗi khi tìm kiếm chỗ ngồi");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!selectedTable) {
      setError("Vui lòng chọn chỗ ngồi");
      return;
    }

    setBookingLoading(true);
    setError("");

    try {
      const bookingData = {
        tableId: selectedTable._id,
        date: selectedDate,
        startTime: selectedTimeStart,
        endTime: selectedTimeEnd,
        pricePerHour: selectedTable.pricePerHour,
        notes: `Đặt ${selectedTable.name} - ${selectedTable.tableType?.name || "N/A"}`,
      };

      const result = await createBookingApi(bookingData);

      setSuccess("Đặt chỗ thành công!");
      setShowConfirmModal(false);

      // Redirect to payment page
      setTimeout(() => {
        navigate(`/payment/${result.bookingId || result._id}`);
      }, 1500);
    } catch (err) {
      setError(err.message || "Lỗi khi đặt chỗ");
    } finally {
      setBookingLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(price)) + "đ";
  };

  const getSelectedTypeInfo = () => {
    return workspaceTypes.find((type) => type.id === selectedType);
  };

  const calculateDuration = () => {
    if (!selectedTimeStart || !selectedTimeEnd) return 0;
    const start = new Date(`2000-01-01T${selectedTimeStart}`);
    const end = new Date(`2000-01-01T${selectedTimeEnd}`);
    return (end - start) / (1000 * 60 * 60); // hours
  };

  const calculateTotalPrice = () => {
    // Use selected table's actual price if available, otherwise fall back to type price
    const duration = calculateDuration();
    if (selectedTable && duration > 0) {
      return Math.round(Number(selectedTable.pricePerHour || 0) * duration);
    }
    const typeInfo = getSelectedTypeInfo();
    return typeInfo && duration > 0 ? Math.round(typeInfo.price * duration) : 0;
  };

  return (
    <div className="min-vh-100 bg-light">
      <GuestCustomerNavbar activeItem="booking" />
      <BookingHeroSection />

      <section className="py-5">
        <Container>
          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError("")}
              className="mb-4"
            >
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setSuccess("")}
              className="mb-4"
            >
              <i className="bi bi-check-circle me-2"></i>
              {success}
            </Alert>
          )}

          <Row className="g-4">
            <Col lg={8}>
              <WorkspaceTypeSelectorCard
                loadingTypes={loadingTypes}
                workspaceTypes={workspaceTypes}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                formatPrice={formatPrice}
              />

              <BookingTimeFormCard
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedTimeStart={selectedTimeStart}
                setSelectedTimeStart={setSelectedTimeStart}
                selectedTimeEnd={selectedTimeEnd}
                setSelectedTimeEnd={setSelectedTimeEnd}
                handleSearch={handleSearch}
                loading={loading}
              />

              <AvailableTablesCard
                availableTables={availableTables}
                selectedTable={selectedTable}
                setSelectedTable={setSelectedTable}
                setShowConfirmModal={setShowConfirmModal}
              />
            </Col>

            <Col lg={4}>
              <BookingSummaryCard
                selectedType={selectedType}
                getSelectedTypeInfo={getSelectedTypeInfo}
                selectedDate={selectedDate}
                selectedTimeStart={selectedTimeStart}
                selectedTimeEnd={selectedTimeEnd}
                calculateDuration={calculateDuration}
                selectedTable={selectedTable}
                formatPrice={formatPrice}
                calculateTotalPrice={calculateTotalPrice}
              />
            </Col>
          </Row>
        </Container>
      </section>

      <BookingConfirmationModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        selectedTable={selectedTable}
        getSelectedTypeInfo={getSelectedTypeInfo}
        selectedDate={selectedDate}
        selectedTimeStart={selectedTimeStart}
        selectedTimeEnd={selectedTimeEnd}
        formatPrice={formatPrice}
        calculateTotalPrice={calculateTotalPrice}
        onConfirm={handleBooking}
        bookingLoading={bookingLoading}
      />
    </div>
  );
}
