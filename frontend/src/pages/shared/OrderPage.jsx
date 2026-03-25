import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Container,
  Row,
  Col,
  Card,
  Modal,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import GuestCustomerNavbar from "../../components/common/GuestCustomerNavbar";
import { useAuth } from "../../hooks/useAuth";
import { apiClient } from "../../services/api";
import { getBookings } from "../../services/bookingService";
import { createOrderApi } from "../../services/orderService";

export function meta() {
  return [
    { title: "Thực đơn & Dịch vụ | Coworking Space" },
    {
      name: "description",
      content:
        "Khám phá thực đơn đa dạng với các loại đồ uống, đồ ăn nhẹ và dịch vụ tiện ích tại Coworking Space.",
    },
  ];
}

const getCategoryVisuals = (categoryName) => {
  const name = categoryName.toLowerCase();

  // Nhóm Cà phê
  if (name.includes("cà phê") || name.includes("coffee")) {
    return { icon: "bi-cup-hot", color: "rgba(139, 92, 246, 0.1)" }; // Tím nhạt
  }
  // Nhóm Bánh / Đồ ăn nhẹ
  if (
    name.includes("đồ ăn") ||
    name.includes("bánh") ||
    name.includes("muffin")
  ) {
    return { icon: "bi-basket", color: "rgba(251, 191, 36, 0.1)" }; // Vàng nhạt
  }
  // Nhóm Trà & Trái cây
  if (
    name.includes("trà") ||
    name.includes("trái cây") ||
    name.includes("nước ép")
  ) {
    return { icon: "bi-cup-straw", color: "rgba(34, 197, 94, 0.1)" }; // Xanh lá nhạt
  }
  // Nhóm Đá xay / Sinh tố
  if (
    name.includes("đá xay") ||
    name.includes("frappuccino") ||
    name.includes("sinh tố")
  ) {
    return { icon: "bi-cup", color: "rgba(59, 130, 246, 0.1)" }; // Xanh dương nhạt (cảm giác lạnh)
  }
  // Nhóm Dịch vụ / Khác (In ấn, văn phòng phẩm...)
  if (
    name.includes("dịch vụ") ||
    name.includes("in ấn") ||
    name.includes("thiết bị")
  ) {
    return { icon: "bi-printer", color: "rgba(99, 102, 241, 0.1)" }; // Chàm
  }

  // Mặc định nếu không khớp nhóm nào
  return { icon: "bi-tag", color: "rgba(108, 117, 125, 0.1)" }; // Xám
};

function normalizeMenuStatus(item) {
  const availability = String(item?.availabilityStatus || "").trim().toUpperCase();
  const stock = Number(item?.stockQuantity || 0);

  if (["OUT_OF_STOCK", "UNAVAILABLE", "OUTOFSTOCK"].includes(availability)) {
    return "OUT_OF_STOCK";
  }
  if (["IN_STOCK", "AVAILABLE"].includes(availability)) {
    return stock > 0 ? "AVAILABLE" : "OUT_OF_STOCK";
  }
  return stock > 0 ? "AVAILABLE" : "OUT_OF_STOCK";
}

export default function MenuPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("QR");
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    const loadMenu = async () => {
      setLoadingMenu(true);
      setMenuError("");
      try {
        const [categoriesRes, itemsRes] = await Promise.all([
          apiClient.get("/menu/categories"),
          apiClient.get("/menu/items"),
        ]);

        const categories = (Array.isArray(categoriesRes) ? categoriesRes : [])
          .filter((c) => c?.isActive !== false);
        const items = Array.isArray(itemsRes) ? itemsRes : [];

        const catMap = new Map(
          categories.map((c) => [String(c._id), c.name || "Khác"]),
        );

        const normalizedItems = items
          .filter((item) => {
            return normalizeMenuStatus(item) === "AVAILABLE";
          })
          .map((item, index) => {
            const rawCatId =
              item?.categoryId?._id || item?.categoryId || "uncategorized";
            const categoryId = String(rawCatId);
            const categoryName =
              item?.categoryId?.name || catMap.get(categoryId) || "Khác";
            const visuals = getCategoryVisuals(categoryName);

            return {
              id: String(item._id),
              name: item.name || "Món không tên",
              description: item.description || "",
              price: Number(item.price || 0),
              icon: visuals.icon,
              color: visuals.color,
              category: categoryName,
              categoryId,
              popular: false,
            };
          });

        setMenuCategories(categories);
        setMenuItems(normalizedItems);
      } catch (err) {
        setMenuError(err.message || "Không thể tải menu từ hệ thống.");
      } finally {
        setLoadingMenu(false);
      }
    };

    loadMenu();
  }, []);

  useEffect(() => {
    const loadBookings = async () => {
      if (!isAuthenticated) {
        setMyBookings([]);
        setSelectedBookingId("");
        return;
      }

      try {
        const rows = await getBookings();
        const nowMs = new Date().getTime();
        const active = (rows || []).filter(
          (b) => 
            b.status !== "Cancelled" && 
            b.status !== "Pending" && 
            new Date(b.endTime).getTime() >= nowMs
        );
        setMyBookings(active);
        setSelectedBookingId((prev) => prev || String(active[0]?.id || ""));
      } catch {
        setMyBookings([]);
      }
    };

    loadBookings();
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedCategory === "all") return;
    const exists = menuCategories.some(
      (c) => String(c?._id) === String(selectedCategory),
    );
    if (!exists) {
      setSelectedCategory("all");
    }
  }, [menuCategories, selectedCategory]);

  const categories = useMemo(() => {
    const base = [
      { id: "all", label: "Tất cả", icon: "", count: menuItems.length },
    ];

    for (const category of menuCategories) {
      const id = String(category._id);
      base.push({
        id,
        label: category.name || "Khác",
        icon: "bi-tag",
        count: menuItems.filter((item) => item.categoryId === id).length,
      });
    }

    return base;
  }, [menuCategories, menuItems]);

  const getAllItems = () => {
    return menuItems;
  };

  const getFilteredItems = () => {
    if (selectedCategory === "all") {
      return getAllItems();
    }
    return menuItems.filter((item) => item.categoryId === selectedCategory);
  };

  const formatPrice = (price, unit = "đ") => {
    return new Intl.NumberFormat("vi-VN").format(price) + unit;
  };

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        ),
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(
      cart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleOrder = async () => {
    setOrderError("");

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!selectedBookingId) {
      setOrderError("Vui lòng chọn booking để tạo đơn hàng.");
      return;
    }

    if (!cart.length) {
      setOrderError("Giỏ hàng đang trống.");
      return;
    }

    try {
      setOrdering(true);
      const result = await createOrderApi({
        bookingId: selectedBookingId,
        items: cart.map((item) => ({
          menuItemId: item.id,
          quantity: Number(item.quantity || 0),
          note: orderNote || "",
        })),
      });

      // Clear cart and close modal
      setCart([]);
      setOrderNote("");
      setShowCartModal(false);

      const orderId = result?.orderId || result?.data?.orderId;
      
      if (paymentMethod === "QR") {
        if (orderId) {
          navigate(`/payment/order/${orderId}`);
        } else {
          setOrderError("Đơn hàng đã được tạo nhưng thiếu orderId.");
        }
      } else {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigate("/customer-dashboard/orders");
        }, 3000);
      }
    } catch (err) {
      setOrderError(err.message || "Không thể tạo order.");
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Header Navigation */}
      <GuestCustomerNavbar activeItem="menu" />

      {/* Success Alert */}
      {showSuccess && (
        <Alert
          variant="success"
          className="mb-0 text-center border-0 rounded-0"
        >
          <i className="bi bi-check-circle me-2"></i>
          Đặt hàng thành công! Chúng tôi sẽ chuẩn bị đơn hàng cho bạn.
        </Alert>
      )}

      {/* Hero Section */}
      <section className="py-5 bg-primary text-white">
        <Container>
          <div className="text-center">
            <div className="mb-3">
              <i className="bi bi-cup-hot display-6"></i>
            </div>
            <h1 className="display-5 fw-bold mb-3">Thực đơn & Dịch vụ</h1>
            <p className="lead mb-0">
              Thưởng thức đồ uống ngon, sử dụng dịch vụ in ấn và thuê thiết bị
            </p>
          </div>
        </Container>
      </section>

      {/* Category Filter */}
      <section className="py-4 bg-white border-bottom">
        <Container>
          {loadingMenu && (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              <span className="text-muted">Đang tải menu...</span>
            </div>
          )}
          {!!menuError && !loadingMenu && (
            <Alert variant="danger" className="mb-3">
              {menuError}
            </Alert>
          )}
          <div className="d-flex justify-content-center">
            <div className="d-flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id
                      ? "primary"
                      : "outline-secondary"
                  }
                  size="sm"
                  className="px-4 py-2 rounded-pill fw-medium position-relative"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.icon && <i className={`${category.icon} me-2`}></i>}
                  {category.label}
                  <Badge
                    bg={selectedCategory === category.id ? "light" : "primary"}
                    text={
                      selectedCategory === category.id ? "primary" : "white"
                    }
                    className="ms-2"
                  >
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Menu Items */}
      <section className="py-5">
        <Container>
          <Row className="g-4">
            {getFilteredItems().map((item) => (
              <Col key={item.id} lg={3} md={4} sm={6}>
                <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-lift">
                  <div
                    className="card-header border-0 p-4 position-relative text-center"
                    style={{
                      backgroundColor: item.color,
                      minHeight: "180px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    {item.popular && (
                      <Badge
                        bg="danger"
                        className="position-absolute top-0 start-0 m-3 px-2 py-1 small"
                      >
                        Phổ biến
                      </Badge>
                    )}

                    <Badge
                      bg="light"
                      text="primary"
                      className="position-absolute top-0 end-0 m-3 px-2 py-1 small"
                    >
                      {item.category}
                    </Badge>

                    <div
                      className="menu-icon mb-3"
                      style={{ fontSize: "4rem" }}
                    >
                      <i className={item.icon}></i>
                    </div>
                  </div>

                  <Card.Body className="p-4 d-flex flex-column">
                    <h6 className="fw-bold mb-2">{item.name}</h6>
                    <p className="text-muted small mb-auto">
                      {item.description}
                    </p>

                    <div className="mt-3">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h5 className="fw-bold text-primary mb-0">
                            {formatPrice(item.price)}
                            {item.unit || ""}
                          </h5>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: "40px", height: "40px" }}
                          onClick={() => addToCart(item)}
                        >
                          <i className="bi bi-plus-lg"></i>
                        </Button>
                      </div>

                      {/* Show quantity if item is in cart */}
                      {cart.find((cartItem) => cartItem.id === item.id) && (
                        <div className="d-flex align-items-center justify-content-center gap-2 p-2 bg-light rounded-3">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: "30px", height: "30px" }}
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                cart.find((cartItem) => cartItem.id === item.id)
                                  .quantity - 1,
                              )
                            }
                          >
                            <i className="bi bi-dash"></i>
                          </Button>

                          <span className="fw-semibold mx-2">
                            {
                              cart.find((cartItem) => cartItem.id === item.id)
                                ?.quantity
                            }
                          </span>

                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: "30px", height: "30px" }}
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                cart.find((cartItem) => cartItem.id === item.id)
                                  .quantity + 1,
                              )
                            }
                          >
                            <i className="bi bi-plus"></i>
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {getFilteredItems().length === 0 && (
            <div className="text-center py-5">
              <i
                className="bi bi-inbox text-muted"
                style={{ fontSize: "4rem" }}
              ></i>
              <h5 className="text-muted mt-3">Không có sản phẩm nào</h5>
              <p className="text-muted">Thử chọn danh mục khác</p>
            </div>
          )}
        </Container>
      </section>

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <div
          className="position-fixed bottom-0 start-50 translate-middle-x p-3"
          style={{ zIndex: 1050 }}
        >
          <Button
            variant="primary"
            size="lg"
            className="px-4 py-3 rounded-pill shadow-lg position-relative"
            onClick={() => setShowCartModal(true)}
          >
            <i className="bi bi-bag me-2"></i>
            Xem giỏ hàng ({getTotalItems()}) - {formatPrice(getTotalPrice())}
          </Button>
        </div>
      )}

      {/* Cart Modal */}
      <Modal
        show={showCartModal}
        onHide={() => setShowCartModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            <i className="bi bi-bag me-2 text-primary"></i>
            Giỏ hàng của bạn
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {cart.length === 0 ? (
            <div className="text-center py-4">
              <i
                className="bi bi-bag-x text-muted"
                style={{ fontSize: "3rem" }}
              ></i>
              <p className="text-muted mt-3 mb-0">Giỏ hàng trống</p>
            </div>
          ) : (
            <>
              <div className="cart-items mb-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="d-flex align-items-center justify-content-between p-3 border-bottom"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="menu-icon" style={{ fontSize: "2rem" }}>
                        <i className={item.icon}></i>
                      </div>
                      <div>
                        <h6 className="mb-1">{item.name}</h6>
                        <p className="text-muted small mb-0">
                          {formatPrice(item.price)}
                          {item.unit || ""} x {item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="rounded-circle"
                          style={{ width: "30px", height: "30px" }}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <i className="bi bi-dash"></i>
                        </Button>

                        <span className="fw-semibold mx-2">
                          {item.quantity}
                        </span>

                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="rounded-circle"
                          style={{ width: "30px", height: "30px" }}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <i className="bi bi-plus"></i>
                        </Button>
                      </div>

                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="rounded-circle ms-2"
                        style={{ width: "30px", height: "30px" }}
                        onClick={() => removeFromCart(item.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Booking áp dụng</Form.Label>
                <Form.Select
                  className="mb-2"
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                >
                  {myBookings.length === 0 ? (
                    <option value="">Không có booking khả dụng</option>
                  ) : (
                    myBookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.bookingCode} - {booking.spaceName}
                      </option>
                    ))
                  )}
                </Form.Select>
                {myBookings.length === 0 && (
                  <small className="text-danger">
                    Bạn cần có booking trước khi tạo order trong menu.
                  </small>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  Phương thức thanh toán
                </Form.Label>
                <div>
                  <Form.Check
                    type="radio"
                    id="pay-qr"
                    label="Thanh toán Online (QR PayOS)"
                    name="paymentMethod"
                    className="mb-2"
                    checked={paymentMethod === "QR"}
                    onChange={() => setPaymentMethod("QR")}
                  />
                  <Form.Check
                    type="radio"
                    id="pay-cash"
                    label="Thanh toán tại quầy (Tiền mặt/Chuyển khoản sau)"
                    name="paymentMethod"
                    checked={paymentMethod === "CASH"}
                    onChange={() => setPaymentMethod("CASH")}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  Ghi chú đơn hàng
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Yêu cầu đặc biệt hoặc ghi chú..."
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                />
              </Form.Group>

              {!!orderError && (
                <Alert variant="danger" className="mb-3 py-2">
                  {orderError}
                </Alert>
              )}

              <div className="d-flex justify-content-between align-items-center p-3 bg-primary bg-opacity-10 rounded-3">
                <span className="fw-bold fs-5">Tổng cộng:</span>
                <span className="fw-bold text-primary fs-4">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
            </>
          )}
        </Modal.Body>
        {cart.length > 0 && (
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => setShowCartModal(false)}
            >
              Tiếp tục chọn
            </Button>
            <Button variant="primary" onClick={handleOrder}>
              {ordering ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang tạo order...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Đặt hàng ngay
                </>
              )}
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </div>
  );
}
