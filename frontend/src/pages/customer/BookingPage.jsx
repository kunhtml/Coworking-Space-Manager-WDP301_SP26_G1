import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
} from "react-bootstrap";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import GuestCustomerNavbar from "../../components/common/GuestCustomerNavbar";
import {
  searchAvailableTables,
  createBookingApi,
} from "../../services/bookingService";
import { apiClient } from "../../services/api";
import {
  buildVietnamDateTime,
  getVietnamDateString,
  VIETNAM_TIMEZONE,
} from "../../utils/timezone";

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

const STATUS_CONFIG = {
  Available: {
    label: "Trống",
    borderColor: "#10b981",
    badgeBg: "#dcfce7",
    badgeColor: "#16a34a",
    dot: "#16a34a",
  },
  Occupied: {
    label: "Đang sử dụng",
    borderColor: "#ef4444",
    badgeBg: "#fee2e2",
    badgeColor: "#dc2626",
    dot: "#dc2626",
  },
  Reserved: {
    label: "Đã đặt trước",
    borderColor: "#f59e0b",
    badgeBg: "#fef9c3",
    badgeColor: "#ca8a04",
    dot: "#ca8a04",
  },
  Maintenance: {
    label: "Bảo trì",
    borderColor: "#94a3b8",
    badgeBg: "#f1f5f9",
    badgeColor: "#64748b",
    dot: "#64748b",
  },
};

const TIME_SLOT_START_MINUTES = 6 * 60;
const TIME_SLOT_END_MINUTES = 23 * 60;
const TIME_SLOT_STEP_MINUTES = 30;

const toHHMM = (totalMinutes) => {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const parseHHMM = (value) => {
  const [h = "0", m = "0"] = String(value || "").split(":");
  return Number(h) * 60 + Number(m);
};

const format12hLabel = (value) => {
  const mins = parseHHMM(value);
  let hour = Math.floor(mins / 60);
  const minute = mins % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  if (hour > 12) hour -= 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
};

const buildTimeSlots = () => {
  const slots = [];
  for (
    let m = TIME_SLOT_START_MINUTES;
    m <= TIME_SLOT_END_MINUTES;
    m += TIME_SLOT_STEP_MINUTES
  ) {
    const value = toHHMM(m);
    slots.push({ value, label: format12hLabel(value), minutes: m });
  }
  return slots;
};

const TIME_SLOTS = buildTimeSlots();

const formatDurationChoice = (hours) => {
  const totalMinutes = Math.round(Number(hours || 0) * 60);
  if (totalMinutes <= 0) return "--";
  if (totalMinutes < 60) return `${totalMinutes} phút`;

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`;
};

function toTypeName(table) {
  const fromObject = String(table?.tableType?.name || "").trim();
  if (fromObject) return fromObject;
  const fromString =
    typeof table?.tableType === "string" ? table.tableType.trim() : "";
  if (fromString) return fromString;
  return "Khác";
}

function startOfTodayIso() {
  return getVietnamDateString();
}

export default function BookingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const PAST_TIME_MESSAGE =
    "Vui lòng chọn lại ngày giờ, không thể chọn giờ bắt đầu ở quá khứ.";

  const [selectedDate, setSelectedDate] = useState(startOfTodayIso());
  const [selectedTimeStart, setSelectedTimeStart] = useState("");
  const [selectedDurationHours, setSelectedDurationHours] = useState("");
  const [allTables, setAllTables] = useState([]);
  const [availableIds, setAvailableIds] = useState(new Set());

  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  const startTimeOptions = TIME_SLOTS;
  const normalizedDurationHours = useMemo(() => {
    const raw = String(selectedDurationHours || "").trim();
    if (!/^\d+$/.test(raw)) return 0;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1 || n > 99) return 0;
    return n;
  }, [selectedDurationHours]);

  const selectedEndDateTime = useMemo(() => {
    const startAt = buildVietnamDateTime(selectedDate, selectedTimeStart);
    const duration = normalizedDurationHours;
    if (!startAt || !Number.isFinite(duration) || duration <= 0) return null;
    return new Date(startAt.getTime() + duration * 3600000);
  }, [selectedDate, selectedTimeStart, normalizedDurationHours]);

  const selectedTimeEndDisplay = useMemo(() => {
    if (!selectedEndDateTime) return "--:--";
    return new Intl.DateTimeFormat("en-US", {
      timeZone: VIETNAM_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(selectedEndDateTime);
  }, [selectedEndDateTime]);

  const loadAllTables = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await apiClient.get("/tables?excludeHiddenTypes=true");
      setAllTables(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err.message || "Không thể tải sơ đồ bàn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllTables();
  }, [loadAllTables]);

  useEffect(() => {
    if (!selectedDate || !selectedTimeStart || !normalizedDurationHours) return;

    const run = async () => {
      setCheckingAvailability(true);
      setError((prev) => (prev === PAST_TIME_MESSAGE ? prev : ""));
      try {
        const available = await searchAvailableTables({
          date: selectedDate,
          startTime: selectedTimeStart,
          duration: normalizedDurationHours,
        });
        const ids = new Set(
          (available || []).map((t) => String(t._id || t.sourceId || t.id)),
        );
        setAvailableIds(ids);
      } catch (err) {
        setAvailableIds(new Set());
        setError(err.message || "Không thể lọc bàn theo thời gian đã chọn.");
      } finally {
        setCheckingAvailability(false);
      }
    };

    run();
  }, [
    selectedDate,
    selectedTimeStart,
    normalizedDurationHours,
    refreshTick,
    PAST_TIME_MESSAGE,
  ]);

  const hasAvailabilityCriteria = useMemo(
    () => Boolean(selectedDate && selectedTimeStart && normalizedDurationHours),
    [selectedDate, selectedTimeStart, normalizedDurationHours],
  );

  const effectiveTables = useMemo(
    () =>
      allTables.map((table) => {
        const id = String(table._id || table.sourceId || table.id);
        const typeName = toTypeName(table);
        const baseStatus = String(table.status || "Available");

        let displayStatus = baseStatus;
        if (hasAvailabilityCriteria && baseStatus !== "Maintenance") {
          displayStatus = availableIds.has(id)
            ? "Available"
            : baseStatus === "Occupied"
              ? "Occupied"
              : "Reserved";
        }

        return {
          ...table,
          id,
          typeName,
          displayStatus,
          pricePerHour: Number(table.pricePerHour || 0),
          capacity: Number(table.capacity || 0),
        };
      }),
    [allTables, availableIds, hasAvailabilityCriteria],
  );

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          effectiveTables
            .map((t) => String(t.typeName || "").trim())
            .filter(Boolean),
        ),
      ).sort(),
    [effectiveTables],
  );

  const stats = useMemo(() => {
    const count = (status) =>
      effectiveTables.filter((t) => t.displayStatus === status).length;
    return {
      Available: count("Available"),
      Occupied: count("Occupied"),
      Reserved: count("Reserved"),
      Maintenance: count("Maintenance"),
      total: effectiveTables.length,
    };
  }, [effectiveTables]);

  const filteredTables = useMemo(() => {
    let rows = effectiveTables.filter((t) => {
      if (!hasAvailabilityCriteria) {
        return t.displayStatus !== "Maintenance";
      }
      return !["Reserved", "Maintenance"].includes(t.displayStatus);
    });

    if (filterStatus !== "all") {
      rows = rows.filter((t) => t.displayStatus === filterStatus);
    }

    if (selectedCategory !== "all") {
      rows = rows.filter((t) => t.typeName === selectedCategory);
    }

    const min = Number(priceMin || 0);
    const max = Number(priceMax || 0);
    if (priceMin) {
      rows = rows.filter((t) => t.pricePerHour >= min);
    }
    if (priceMax) {
      rows = rows.filter((t) => t.pricePerHour <= max);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (t) =>
          String(t.name || "")
            .toLowerCase()
            .includes(q) ||
          String(t.typeName || "")
            .toLowerCase()
            .includes(q),
      );
    }

    return rows;
  }, [
    effectiveTables,
    filterStatus,
    selectedCategory,
    priceMin,
    priceMax,
    search,
    hasAvailabilityCriteria,
  ]);

  const groupedTables = useMemo(() => {
    const map = new Map();
    filteredTables.forEach((t) => {
      const key = t.typeName || "Khác";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    });
    return Array.from(map.entries());
  }, [filteredTables]);

  const isPastTimeSelection = useMemo(() => {
    const startAt = buildVietnamDateTime(selectedDate, selectedTimeStart);
    if (!startAt) return false;
    return startAt.getTime() <= Date.now();
  }, [selectedDate, selectedTimeStart]);

  useEffect(() => {
    if (isPastTimeSelection) {
      setError(PAST_TIME_MESSAGE);
      return;
    }

    setError((prev) => (prev === PAST_TIME_MESSAGE ? "" : prev));
  }, [
    isPastTimeSelection,
    selectedDate,
    selectedTimeStart,
    normalizedDurationHours,
    PAST_TIME_MESSAGE,
  ]);

  useEffect(() => {
    if (["Reserved", "Maintenance"].includes(filterStatus)) {
      setFilterStatus("all");
    }
  }, [filterStatus]);

  const toggleCategory = (name) => {
    setSelectedCategory((prev) => (prev === name ? "all" : name));
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

    if (!selectedTimeStart || !normalizedDurationHours) {
      setError("Vui lòng chọn giờ bắt đầu và thời gian cần thuê.");
      return;
    }

    if (isPastTimeSelection) {
      setError(PAST_TIME_MESSAGE);
      return;
    }

    setBookingLoading(true);
    setError("");

    try {
      const bookingData = {
        tableId: selectedTable.id,
        date: selectedDate,
        startTime: selectedTimeStart,
        duration: normalizedDurationHours,
        pricePerHour: selectedTable.pricePerHour,
        notes: `Đặt ${selectedTable.name} - ${selectedTable.typeName || "N/A"}`,
      };

      const result = await createBookingApi(bookingData);

      setSuccess("Đặt chỗ thành công!");

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

  const calculateDuration = () => {
    const duration = normalizedDurationHours;
    return Number.isFinite(duration) && duration > 0 ? duration : 0;
  };

  const formatDurationText = () => {
    return formatDurationChoice(calculateDuration());
  };

  const calculateTotalPrice = () => {
    const duration = calculateDuration();
    if (selectedTable && duration > 0) {
      return Math.round(Number(selectedTable.pricePerHour || 0) * duration);
    }
    return 0;
  };

  const handleClearFilters = () => {
    setFilterStatus("all");
    setSearch("");
    setSelectedCategory("all");
    setPriceMin("");
    setPriceMax("");
  };

  return (
    <div className="min-vh-100 bg-light">
      <GuestCustomerNavbar activeItem="booking" />
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

          <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
            <div>
              <h2 className="fw-bold mb-1">Sơ đồ chỗ ngồi</h2>
              <p className="text-secondary fw-semibold small mb-0">
                Chọn thời gian để xem bàn khả dụng theo thời gian thực
              </p>
            </div>
            <Button
              variant="outline-secondary"
              className="fw-semibold rounded-3"
              onClick={() => {
                loadAllTables();
                setRefreshTick((v) => v + 1);
              }}
              disabled={loading || checkingAvailability}
            >
              {loading || checkingAvailability ? "Đang tải..." : "Làm mới"}
            </Button>
          </div>

          <Row className="g-3 mb-4">
            {["Available", "Occupied"].map((statusKey) => {
              const cfg = STATUS_CONFIG[statusKey];
              return (
                <Col xs={6} md={3} lg={2} key={statusKey}>
                  <div
                    className="rounded-4 p-3 d-flex align-items-center gap-2"
                    style={{
                      background: cfg.badgeBg,
                      border: `1px solid ${cfg.borderColor}55`,
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setFilterStatus(
                        filterStatus === statusKey ? "all" : statusKey,
                      )
                    }
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: cfg.dot,
                      }}
                    />
                    <div>
                      <div
                        className="fw-bold"
                        style={{ color: cfg.badgeColor }}
                      >
                        {stats[statusKey]}
                      </div>
                      <div className="small text-secondary">{cfg.label}</div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>

          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Body>
              <Row className="g-3 mb-3">
                <Col md={3}>
                  <Form.Label className="fw-semibold">Ngày đặt</Form.Label>
                  <Form.Control
                    type="date"
                    value={selectedDate}
                    min={startOfTodayIso()}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="fw-semibold">Bắt đầu</Form.Label>
                  <Form.Select
                    value={selectedTimeStart}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      setSelectedTimeStart(nextStart);
                      setSelectedDurationHours("");
                    }}
                  >
                    <option value="">Chọn giờ bắt đầu</option>
                    {startTimeOptions.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className="fw-semibold">
                    Thời gian cần thuê
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedDurationHours}
                    disabled={!selectedTimeStart}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    placeholder="Nhập số giờ (1-99)"
                    onChange={(e) => {
                      const value = String(e.target.value || "").trim();
                      if (value === "") {
                        setSelectedDurationHours("");
                        return;
                      }
                      if (!/^\d+$/.test(value)) return;
                      if (value.length > 2) return;
                      const parsed = Number(value);
                      if (parsed < 1 || parsed > 99) return;
                      setSelectedDurationHours(value);
                    }}
                  />
                </Col>
                <Col md={5}>
                  <Form.Label className="fw-semibold">Tìm kiếm</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Tìm tên bàn, loại bàn..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Col>
              </Row>

              <Row className="g-3 align-items-center mt-1">
                <Col md={12} className="d-flex justify-content-md-end">
                  <Badge bg="light" text="dark" className="px-3 py-2 border">
                    Khung giờ:{" "}
                    {selectedTimeStart
                      ? format12hLabel(selectedTimeStart)
                      : "--:--"}{" "}
                    - {selectedTimeEndDisplay}
                  </Badge>
                </Col>
              </Row>

              <Row className="g-3 align-items-end">
                <Col md={3}>
                  <Form.Label className="fw-semibold">Trạng thái</Form.Label>
                  <Form.Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="Available">Trống</option>
                    <option value="Occupied">Đang sử dụng</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className="fw-semibold">Giá từ (đ/h)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="fw-semibold">Giá đến (đ/h)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </Col>
                <Col md={5} className="d-flex justify-content-md-end">
                  <Button
                    variant="outline-secondary"
                    onClick={handleClearFilters}
                  >
                    Xóa bộ lọc
                  </Button>
                </Col>
              </Row>

              <div className="mt-3">
                <div className="fw-semibold small text-secondary mb-2">
                  Lọc theo category:
                </div>
                <div className="d-flex flex-wrap gap-3">
                  <Form.Check
                    type="checkbox"
                    label="All"
                    checked={selectedCategory === "all"}
                    onChange={() => setSelectedCategory("all")}
                  />
                  {categoryOptions.map((cat) => (
                    <Form.Check
                      key={cat}
                      type="checkbox"
                      label={cat}
                      checked={selectedCategory === cat}
                      onChange={() => toggleCategory(cat)}
                    />
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>

          <Row className="g-4 align-items-start">
            <Col lg={8}>
              {loading ? (
                <div className="text-center py-5 text-muted">
                  Đang tải dữ liệu bàn...
                </div>
              ) : groupedTables.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  Không có bàn phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                groupedTables.map(([zone, tables]) => (
                  <div key={zone} className="mb-5">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <h5 className="fw-bold text-secondary mb-0">{zone}</h5>
                      <span
                        className="rounded-pill px-3 py-1 small fw-bold"
                        style={{ background: "#f1f5f9", color: "#475569" }}
                      >
                        {tables.length} bàn
                      </span>
                      <div
                        style={{ flex: 1, height: 1, background: "#e2e8f0" }}
                      />
                    </div>

                    <Row className="g-3">
                      {tables.map((table) => {
                        const cfg =
                          STATUS_CONFIG[table.displayStatus] ||
                          STATUS_CONFIG.Available;
                        const isSelected = selectedTable?.id === table.id;
                        return (
                          <Col xl={4} lg={6} md={6} sm={6} key={table.id}>
                            <Card
                              className="border-2"
                              style={{
                                cursor:
                                  table.displayStatus === "Available"
                                    ? "pointer"
                                    : "not-allowed",
                                borderColor: isSelected
                                  ? "#2563eb"
                                  : cfg.borderColor,
                                boxShadow: isSelected
                                  ? "0 10px 24px rgba(37,99,235,0.25)"
                                  : "0 2px 8px rgba(0,0,0,0.05)",
                                opacity:
                                  table.displayStatus === "Available"
                                    ? 1
                                    : 0.86,
                              }}
                              onClick={() => {
                                if (table.displayStatus !== "Available") return;
                                setSelectedTable(table);
                                setError("");
                              }}
                            >
                              <Card.Body className="text-center px-2 py-3">
                                <h6
                                  className="fw-bold mb-1 text-truncate"
                                  title={table.name}
                                >
                                  {table.name}
                                </h6>
                                <div
                                  className="text-secondary fw-semibold mb-1"
                                  style={{ fontSize: "0.76rem" }}
                                >
                                  {table.typeName}
                                </div>
                                <div
                                  className="fw-semibold mb-2"
                                  style={{
                                    fontSize: "0.76rem",
                                    color: "#64748b",
                                  }}
                                >
                                  {table.capacity
                                    ? `${table.capacity} chỗ`
                                    : ""}
                                  {table.capacity && table.pricePerHour
                                    ? " · "
                                    : ""}
                                  {table.pricePerHour
                                    ? `${formatPrice(table.pricePerHour)}/h`
                                    : ""}
                                </div>
                                <Badge
                                  pill
                                  style={{
                                    background: cfg.badgeBg,
                                    color: cfg.badgeColor,
                                  }}
                                >
                                  {cfg.label}
                                </Badge>
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  </div>
                ))
              )}
            </Col>

            <Col lg={4}>
              <Card
                className="border-0 shadow-sm rounded-4 position-sticky"
                style={{ top: "96px" }}
              >
                <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <div className="fw-semibold">Bàn đã chọn</div>
                    <div className="text-secondary small">
                      {selectedTable ? selectedTable.name : "Chưa chọn bàn"}
                    </div>
                    <div className="text-secondary small">
                      {selectedTable
                        ? `${selectedTable.typeName} · ${formatPrice(selectedTable.pricePerHour)}/h`
                        : "--"}
                    </div>
                    <div className="text-secondary small">
                      {selectedDate} · {selectedTimeStart || "--:--"} -{" "}
                      {selectedEndDateTime ? selectedTimeEndDisplay : "--:--"}
                    </div>
                    <div className="text-secondary small">
                      Tổng thời gian: {formatDurationText()}
                    </div>
                    <div className="text-secondary small">
                      Tổng tạm tính: {formatPrice(calculateTotalPrice())}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    disabled={
                      !selectedTable || bookingLoading || isPastTimeSelection
                    }
                    onClick={handleBooking}
                  >
                    {bookingLoading ? "Đang đặt..." : "Xác nhận đặt bàn"}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}
