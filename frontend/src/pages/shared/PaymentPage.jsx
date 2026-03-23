import { useEffect, useState, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import { useParams, useNavigate, Link, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import {
  getPaymentData,
  getOrderPaymentData,
  createPaymentApi,
  createOrderPaymentApi,
  cancelPaymentApi,
} from "../../services/bookingService";

// ─── Icons ───
import {
  HiCreditCard,
  HiQrCode,
  HiXMark,
  HiClipboardDocument,
  HiClipboardDocumentCheck,
  HiBuildingLibrary,
  HiHashtag,
  HiUser,
  HiBanknotes,
  HiDocumentText,
  HiCheck,
  HiArrowTopRightOnSquare,
  HiDevicePhoneMobile,
  HiExclamationTriangle,
  HiArrowPath,
  HiLightBulb,
  HiCog6Tooth,
  HiCheckCircle,
  HiArrowRight,
  HiSparkles,
  HiXCircle,
  HiShieldCheck,
} from "react-icons/hi2";

import {
  RiSecurePaymentFill,
  RiQrScan2Line,
  RiFileCopyLine,
  RiFileCopyFill,
  RiExternalLinkLine,
  RiCloseLine,
  RiLoader4Line,
  RiStarFill,
  RiCheckDoubleFill,
} from "react-icons/ri";

export function meta() {
  return [{ title: "Thanh toán QR | Coworking Space" }];
}

/* ─── helpers ─── */
function formatVND(n) {
  if (!n && n !== 0) return "--";
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

/* ─── keyframes ─── */
const STYLE_ID = "payment-page-keyframes";
function injectKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes pp-fadeUp {
      from { opacity: 0; transform: translateY(32px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes pp-scaleIn {
      from { opacity: 0; transform: scale(0.6); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes pp-pulse {
      0%, 100% { opacity: 1; }
      50%      { opacity: .45; }
    }
    @keyframes pp-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pp-shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes pp-ripple {
      0%   { box-shadow: 0 0 0 0 rgba(34,197,94,.45); }
      70%  { box-shadow: 0 0 0 18px rgba(34,197,94,0); }
      100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
    }
    @keyframes pp-checkBounce {
      0%   { transform: scale(0); }
      50%  { transform: scale(1.25); }
      70%  { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    @keyframes pp-confetti {
      0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
      100% { opacity: 0; transform: translateY(-80px) rotate(360deg); }
    }
    @keyframes pp-gradientMove {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes pp-float {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-8px); }
    }
    @keyframes pp-dotPulse {
      0%, 80%, 100% { transform: scale(0); opacity: .5; }
      40%           { transform: scale(1); opacity: 1; }
    }
    @keyframes pp-iconSpin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes pp-slideDown {
      from { opacity: 0; transform: translateY(-12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pp-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,.2); }
      50%      { box-shadow: 0 0 40px rgba(99,102,241,.4); }
    }
  `;
  document.head.appendChild(style);
}

/* ─── Copy Button ─── */
function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(String(value)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };
  return (
    <button
      onClick={copy}
      title="Sao chép"
      style={{
        background: copied
          ? "linear-gradient(135deg,#22c55e,#16a34a)"
          : "rgba(99,102,241,.08)",
        border: copied ? "none" : "1px solid rgba(99,102,241,.15)",
        borderRadius: 8,
        padding: "4px 12px",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        color: copied ? "#fff" : "#6366f1",
        marginLeft: 8,
        lineHeight: 1.6,
        transition: "all .25s cubic-bezier(.4,0,.2,1)",
        letterSpacing: 0.3,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {copied ? (
        <>
          <HiClipboardDocumentCheck size={13} />
          Đã sao chép
        </>
      ) : (
        <>
          <HiClipboardDocument size={13} />
          Sao chép
        </>
      )}
    </button>
  );
}

/* ─── Info Row ─── */
function InfoRow({ icon: Icon, label, value, highlight, copyable, mono }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: "1px solid rgba(0,0,0,.04)",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "#64748b",
          fontSize: 13,
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {Icon && (
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: highlight
                ? "rgba(99,102,241,.08)"
                : "rgba(100,116,139,.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={15} color={highlight ? "#6366f1" : "#94a3b8"} />
          </div>
        )}
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontWeight: 700,
          fontSize: highlight ? 15 : 14,
          color: highlight ? "#6366f1" : "#0f172a",
          fontFamily: mono
            ? "'JetBrains Mono','Fira Code','Cascadia Code',monospace"
            : "inherit",
          letterSpacing: mono ? 0.8 : 0,
        }}
      >
        {value}
        {copyable && value && value !== "--" && <CopyButton value={value} />}
      </div>
    </div>
  );
}

/* ─── Waiting Dots ─── */
function WaitingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, marginLeft: 6 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#22c55e",
            display: "inline-block",
            animation: `pp-dotPulse 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

/* ─── Confetti Icons for success ─── */
const confettiIcons = [HiSparkles, RiStarFill, HiSparkles, RiStarFill];

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function PaymentPage() {
  const { bookingId, orderId } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Determine payment type based on URL path
  const isOrderPayment = location.pathname.includes("/payment/order/");
  const paymentId = isOrderPayment ? orderId : bookingId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null); // 5-min cancel timer (seconds)
  const [cancelled, setCancelled] = useState(false);
  const [criticalError, setCriticalError] = useState(false); // Stop auto-retry on critical errors

  useEffect(() => injectKeyframes(), []);

  const fetchData = useCallback(async () => {
    if (criticalError) return; // Don't retry if we have a critical error

    try {
      const res = isOrderPayment 
        ? await getOrderPaymentData(orderId)
        : await getPaymentData(bookingId);
      
      console.log(`${isOrderPayment ? 'Order' : 'Booking'} payment data:`, {
        paymentStatus: res?.payment?.paymentStatus,
        remainingAmount: res?.invoice?.remainingAmount,
        invoiceStatus: res?.invoice?.status,
      });
      setData(res);
      setError("");
    } catch (err) {
      const errorMsg = err.message || "Không thể tải dữ liệu thanh toán.";
      setError(errorMsg);

      // If it's a 404 or 403 error, stop auto-retrying
      if (
        errorMsg.includes("không tìm thấy") ||
        errorMsg.includes("không có quyền") ||
        errorMsg.includes("không hợp lệ")
      ) {
        setCriticalError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [bookingId, orderId, isOrderPayment, criticalError]);

  const handleCreatePayment = async () => {
    if (criticalError) return; // Don't try to create payment if we have a critical error

    setCreatingPayment(true);
    setError("");
    try {
      if (isOrderPayment) {
        await createOrderPaymentApi(orderId);
      } else {
        await createPaymentApi(bookingId);
      }
      await fetchData();
    } catch (err) {
      const errorMsg = err.message || "Không thể tạo link thanh toán.";
      setError(errorMsg);

      // If it's a critical error, stop auto-retrying
      if (
        errorMsg.includes("không tìm thấy") ||
        errorMsg.includes("không có quyền") ||
        errorMsg.includes("không hợp lệ")
      ) {
        setCriticalError(true);
      }
    } finally {
      setCreatingPayment(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, navigate, fetchData]);

  // Auto-create payment when data loads and no payment exists yet
  useEffect(() => {
    if (!data || criticalError) return;
    if (
      data.payosEnabled &&
      data.ui?.canPay &&
      !data.payment &&
      !creatingPayment
    ) {
      handleCreatePayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.payment, data?.payosEnabled, data?.ui?.canPay, criticalError]);

  useEffect(() => {
    if (
      !data?.ui?.canPay ||
      data?.payment?.paymentStatus !== "Pending" ||
      criticalError
    )
      return;
    const timer = setInterval(() => fetchData(), 5000);
    return () => clearInterval(timer);
  }, [data, fetchData, criticalError]);

  // Start 5-minute cancel countdown when QR becomes visible
  useEffect(() => {
    if (
      !data?.payment?.qrCodeDataUrl ||
      data?.payment?.paymentStatus !== "Pending"
    )
      return;
    if (timeLeft !== null) return; // already started
    setTimeLeft(5 * 60);
  }, [data, timeLeft]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  // When timer hits 0 — auto cancel
  useEffect(() => {
    if (timeLeft !== 0) return;
    (async () => {
      try {
        await cancelPaymentApi(bookingId);
      } catch {
        /* ignore */
      }
      setCancelled(true);
    })();
  }, [timeLeft, bookingId]);

  // Backend maps PayOS PAID -> "Success"
  // Only consider paid if payment status is Success AND remaining amount is 0
  const isPaid =
    data?.payment?.paymentStatus === "Success" &&
    data?.invoice?.remainingAmount === 0;

  console.log("isPaid check:", {
    paymentStatus: data?.payment?.paymentStatus,
    remainingAmount: data?.invoice?.remainingAmount,
    isPaid,
  });

  useEffect(() => {
    if (!isPaid || countdown !== null) return;
    console.log("Starting success countdown...");
    setCountdown(3);
  }, [isPaid, countdown]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      navigate("/dashboard");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, navigate]);

  /* ── render ── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        backgroundSize: "400% 400%",
        animation: "pp-gradientMove 15s ease infinite",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "var(--bs-font-monospace)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%)",
          top: "-15%",
          right: "-10%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(168,85,247,.1) 0%, transparent 70%)",
          bottom: "-10%",
          left: "-8%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(236,72,153,.08) 0%, transparent 70%)",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      {/* ════ SUCCESS OVERLAY ════ */}
      {isPaid && countdown !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            animation: "pp-fadeUp .4s ease",
          }}
        >
          <div
            style={{
              background: "linear-gradient(145deg, #ffffff, #f8fafc)",
              borderRadius: 28,
              padding: "52px 44px 44px",
              maxWidth: 440,
              width: "92%",
              textAlign: "center",
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,.1)",
              animation: "pp-scaleIn .5s cubic-bezier(.34,1.56,.64,1)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Confetti particles */}
            {confettiIcons.map((ConfIcon, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  top: "20%",
                  left: `${15 + i * 22}%`,
                  animation: `pp-confetti ${1.2 + i * 0.3}s ease-out ${
                    i * 0.15
                  }s forwards`,
                  pointerEvents: "none",
                  color: ["#f59e0b", "#6366f1", "#ec4899", "#22c55e"][i],
                }}
              >
                <ConfIcon size={20} />
              </span>
            ))}

            {/* Success icon */}
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                animation:
                  "pp-checkBounce .6s cubic-bezier(.34,1.56,.64,1), pp-ripple 1.5s ease-out infinite",
                boxShadow: "0 16px 40px rgba(34,197,94,.35)",
              }}
            >
              <HiShieldCheck size={44} color="#fff" />
            </div>

            <h2
              style={{
                fontWeight: 800,
                fontSize: 24,
                color: "#0f172a",
                marginBottom: 8,
                letterSpacing: -0.3,
              }}
            >
              Thanh toán thành công!
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: 15,
                marginBottom: 28,
                lineHeight: 1.6,
              }}
            >
              {isOrderPayment 
                ? "Đơn hàng của bạn đã được xác nhận thanh toán"
                : "Đơn đặt bàn của bạn đã được xác nhận thanh toán"}
            </p>

            {/* Countdown ring */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 28,
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "3px solid #e2e8f0",
                  borderTopColor: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 16,
                  color: "#22c55e",
                  animation: "pp-spin 1s linear infinite",
                }}
              >
                <span
                  style={{
                    animation: "pp-spin 1s linear infinite reverse",
                  }}
                >
                  {countdown}
                </span>
              </div>
              <span>Tự động chuyển hướng...</span>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "15px 0",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                width: "100%",
                boxShadow: "0 8px 28px rgba(34,197,94,.3)",
                transition: "all .2s ease",
                letterSpacing: 0.3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 14px 36px rgba(34,197,94,.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 28px rgba(34,197,94,.3)";
              }}
            >
              <RiCheckDoubleFill size={18} />
              Xem danh sách hóa đơn
              <HiArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Cancelled/timeout overlay */}
      {cancelled && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "linear-gradient(145deg,#ffffff,#f8fafc)",
              borderRadius: 24,
              padding: "52px 44px 44px",
              maxWidth: 440,
              width: "92%",
              textAlign: "center",
              boxShadow: "0 32px 80px rgba(0,0,0,.35)",
            }}
          >
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#fca5a5,#ef4444)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                boxShadow: "0 12px 32px rgba(239,68,68,.3)",
                fontSize: 40,
              }}
            >
              ⏰
            </div>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 23,
                color: "#0f172a",
                marginBottom: 10,
              }}
            >
              Hết thời gian thanh toán
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: 15,
                marginBottom: 32,
                lineHeight: 1.6,
              }}
            >
              Đơn đặt bàn đã bị hủy do không thanh toán trong vòng{" "}
              <strong style={{ color: "#ef4444" }}>5 phút</strong>.
            </p>
            <button
              onClick={() => navigate("/order-table")}
              style={{
                background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "14px 0",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                width: "100%",
                marginBottom: 12,
                boxShadow: "0 8px 24px rgba(99,102,241,.3)",
              }}
            >
              Đặt lại bàn
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: 14,
                padding: "13px 0",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Xem danh sách đặt bàn
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            animation: "pp-fadeUp .5s ease",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(255,255,255,.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              backdropFilter: "blur(8px)",
            }}
          >
            <RiLoader4Line
              size={32}
              color="#a78bfa"
              style={{ animation: "pp-spin .9s linear infinite" }}
            />
          </div>
          <p
            style={{
              color: "rgba(255,255,255,.6)",
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: 0.2,
            }}
          >
            Đang tải thông tin thanh toán...
          </p>
        </div>
      )}

      {/* ════ ERROR ════ */}
      {!loading && error && (
        <div
          style={{
            background: "rgba(255,255,255,.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 24,
            padding: "44px 36px",
            maxWidth: 420,
            textAlign: "center",
            animation: "pp-fadeUp .5s ease",
            boxShadow: "0 24px 64px rgba(0,0,0,.3)",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <HiExclamationTriangle size={34} color="#dc2626" />
          </div>
          <p
            style={{
              color: "#0f172a",
              fontWeight: 800,
              fontSize: 18,
              marginBottom: 6,
            }}
          >
            Đã xảy ra lỗi
          </p>
          <p
            style={{
              color: "#64748b",
              fontSize: 14,
              marginBottom: 28,
              lineHeight: 1.6,
            }}
          >
            {error}
          </p>
          {criticalError ? (
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "13px 40px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: "0 8px 24px rgba(99,102,241,.3)",
                transition: "all .2s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <HiArrowPath size={16} />
              Quay về Dashboard
            </button>
          ) : (
            <button
              onClick={fetchData}
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "13px 40px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: "0 8px 24px rgba(99,102,241,.3)",
                transition: "all .2s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <HiArrowPath size={16} />
              Thử lại
            </button>
          )}
        </div>
      )}

      {/* ════ MAIN CARD ════ */}
      {!loading && data && (
        <div
          style={{
            background: "rgba(255,255,255,.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: 28,
            width: "100%",
            maxWidth: 480,
            boxShadow:
              "0 32px 80px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.08)",
            overflow: "hidden",
            animation: "pp-fadeUp .6s cubic-bezier(.22,1,.36,1)",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
              padding: "22px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <div
              style={{
                position: "absolute",
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: "rgba(255,255,255,.07)",
                top: -50,
                right: -30,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: "rgba(255,255,255,.05)",
                bottom: -35,
                left: 50,
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: "rgba(255,255,255,.18)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RiSecurePaymentFill size={22} color="#fff" />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 17,
                    color: "#fff",
                    letterSpacing: 0.2,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Thanh toán QR
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,.7)",
                    fontWeight: 500,
                    marginTop: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <RiQrScan2Line size={13} />
                  Quét mã bằng ứng dụng ngân hàng
                </div>
              </div>
            </div>

            <Link
              to="/dashboard"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "rgba(255,255,255,.12)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                textDecoration: "none",
                transition: "all .2s ease",
                position: "relative",
                flexShrink: 0,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,.25)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,.12)")
              }
            >
              <HiXMark size={18} strokeWidth={1} />
            </Link>
          </div>

          {/* ── Booking Summary ── */}
          {data && (
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fafbfc",
              }}
            >
              {data.table && (
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: "#1e293b",
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "rgba(99,102,241,.1)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <HiBuildingLibrary size={15} color="#6366f1" />
                  </span>
                  {data.table.name}
                  {data.table.location && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        fontWeight: 500,
                      }}
                    >
                      · {data.table.location}
                    </span>
                  )}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px 20px",
                  fontSize: 13,
                  color: "#64748b",
                  fontWeight: 500,
                }}
              >
                <span>
                  <HiDocumentText
                    size={13}
                    style={{ marginRight: 4, verticalAlign: "middle" }}
                  />
                  {isOrderPayment ? (
                    <>Đơn hàng #{data.order?.id?.slice(-8)}</>
                  ) : (
                    <>Booking #{data.booking?.id}</>
                  )}
                </span>
                {!isOrderPayment && data.booking?.date && <span>📅 {data.booking.date}</span>}
                {!isOrderPayment && data.booking?.startTime && data.booking?.endTime && (
                  <span>
                    🕐 {data.booking.startTime} – {data.booking.endTime}
                  </span>
                )}
                {isOrderPayment && data.order?.createdAt && (
                  <span>📅 {new Date(data.order.createdAt).toLocaleDateString("vi-VN")}</span>
                )}
              </div>
              <div
                style={{
                  marginTop: 8,
                  background: "linear-gradient(135deg, #ede9fe, #e0e7ff)",
                  borderRadius: 10,
                  padding: "8px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid rgba(99,102,241,.12)",
                }}
              >
                <span
                  style={{ fontSize: 13, color: "#4338ca", fontWeight: 600 }}
                >
                  Số tiền cần thanh toán
                </span>
                <span
                  style={{ fontSize: 16, color: "#6366f1", fontWeight: 800 }}
                >
                  {data.invoice?.remainingFormatted ||
                    data.booking?.depositFormatted}
                </span>
              </div>
            </div>
          )}

          {/* ── QR Area ── */}
          <div style={{ padding: "24px 24px 16px" }}>
            {/* No payment — auto-creating, show spinner */}
            {data.payosEnabled && data.ui?.canPay && !data.payment && (
              <div
                style={{
                  padding: "40px 0",
                  textAlign: "center",
                }}
              >
                <RiLoader4Line
                  size={40}
                  color="#6366f1"
                  style={{
                    animation: "pp-spin .9s linear infinite",
                    marginBottom: 16,
                  }}
                />
                <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
                  Đang tạo mã QR thanh toán...
                </p>
              </div>
            )}

            {/* QR image */}
            {data.ui?.canPay && data.payment?.qrCodeDataUrl && (
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "#fff",
                    borderRadius: 24,
                    padding: 14,
                    border: "2px solid #e5e7eb",
                    boxShadow: "0 8px 32px rgba(0,0,0,.06)",
                    animation: "pp-scaleIn .5s cubic-bezier(.34,1.56,.64,1)",
                    position: "relative",
                  }}
                >
                  {/* Corner brackets */}
                  {[
                    { top: 8, left: 8 },
                    { top: 8, right: 8 },
                    { bottom: 8, left: 8 },
                    { bottom: 8, right: 8 },
                  ].map((pos, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        ...pos,
                        width: 22,
                        height: 22,
                        borderColor: "#6366f1",
                        borderStyle: "solid",
                        borderWidth: 0,
                        ...(i === 0 && {
                          borderTopWidth: 3,
                          borderLeftWidth: 3,
                          borderTopLeftRadius: 10,
                        }),
                        ...(i === 1 && {
                          borderTopWidth: 3,
                          borderRightWidth: 3,
                          borderTopRightRadius: 10,
                        }),
                        ...(i === 2 && {
                          borderBottomWidth: 3,
                          borderLeftWidth: 3,
                          borderBottomLeftRadius: 10,
                        }),
                        ...(i === 3 && {
                          borderBottomWidth: 3,
                          borderRightWidth: 3,
                          borderBottomRightRadius: 10,
                        }),
                      }}
                    />
                  ))}
                  <img
                    src={data.payment.qrCodeDataUrl}
                    alt="QR thanh toán"
                    width={260}
                    height={260}
                    style={{
                      display: "block",
                      borderRadius: 14,
                    }}
                  />
                </div>

                {/* Scan hint */}
                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    color: "#94a3b8",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  <RiQrScan2Line size={14} />
                  Mở ứng dụng ngân hàng và quét mã QR
                </div>
              </div>
            )}

            {/* Already paid — inline */}
            {isPaid && !data.payment?.qrCodeDataUrl && (
              <div
                style={{
                  background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                  borderRadius: 18,
                  padding: "28px 20px",
                  textAlign: "center",
                  border: "1px solid #bbf7d0",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                    boxShadow: "0 8px 24px rgba(34,197,94,.25)",
                  }}
                >
                  <HiCheck size={28} color="#fff" strokeWidth={2} />
                </div>
                <p
                  style={{
                    color: "#166534",
                    fontWeight: 700,
                    fontSize: 16,
                    margin: 0,
                  }}
                >
                  Thanh toán thành công!
                </p>
              </div>
            )}

            {/* PayOS not configured */}
            {!data.payosEnabled && (
              <div
                style={{
                  background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
                  borderRadius: 16,
                  padding: "20px",
                  border: "1px solid #bae6fd",
                  fontSize: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 14,
                    fontWeight: 700,
                    color: "#0369a1",
                    fontSize: 15,
                  }}
                >
                  <span style={{ fontSize: 22 }}>🏦</span>
                  Chuyển khoản thủ công
                </div>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 10,
                    border: "1px solid #e0f2fe",
                    fontSize: 13,
                    color: "#0f172a",
                    lineHeight: 1.8,
                  }}
                >
                  <div>
                    <strong>Ngân hàng:</strong> MB Bank / VietcomBank / TPBank
                  </div>
                  <div>
                    <strong>Số TK:</strong> Liên hệ nhân viên tại quầy
                  </div>
                  <div>
                    <strong>Nội dung CK:</strong>{" "}
                    <code
                      style={{
                        background: "#f1f5f9",
                        padding: "1px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {isOrderPayment ? `Order ${data.order?.id?.slice(-8)}` : `Booking #${data.booking?.id}`}
                    </code>
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(3,105,161,.08)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    color: "#0369a1",
                    fontSize: 13,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <HiLightBulb size={15} />
                  Vui lòng liên hệ nhân viên để xác nhận thanh toán sau khi
                  chuyển khoản.
                </div>
              </div>
            )}
          </div>

          {/* ── Bank details ── */}
          {data.payment && (
            <>
              <div style={{ padding: "0 24px" }}>
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 18,
                    padding: "4px 20px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <InfoRow
                    icon={HiBuildingLibrary}
                    label="Ngân hàng"
                    value={data.payment.accountName ? "Ngân hàng nhận" : "--"}
                  />
                  <InfoRow
                    icon={HiHashtag}
                    label="Số tài khoản"
                    value={data.payment.accountNumber || "--"}
                    copyable
                    mono
                  />
                  <InfoRow
                    icon={HiUser}
                    label="Chủ tài khoản"
                    value={data.payment.accountName || "--"}
                  />
                  <InfoRow
                    icon={HiBanknotes}
                    label="Số tiền"
                    value={formatVND(
                      data.invoice?.remainingAmount ??
                        data.booking?.depositAmount,
                    )}
                    highlight
                  />
                  <InfoRow
                    icon={HiDocumentText}
                    label="Nội dung CK"
                    value={data.payment.description || "--"}
                    highlight
                    copyable
                    mono
                  />
                </div>
              </div>

              {/* Info note */}
              <div
                style={{
                  margin: "16px 24px 8px",
                  background: "linear-gradient(135deg, #ede9fe, #e0e7ff)",
                  borderRadius: 14,
                  padding: "14px 18px",
                  fontSize: 13,
                  color: "#4338ca",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  fontWeight: 500,
                  lineHeight: 1.6,
                  border: "1px solid rgba(99,102,241,.1)",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "rgba(99,102,241,.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <HiLightBulb size={15} color="#6366f1" />
                </div>
                <span>
                  Vui lòng nhập <strong>đúng nội dung</strong> chuyển khoản để
                  giao dịch được xử lý tự động.
                </span>
              </div>

              {/* Waiting banner */}
              {!isPaid && data.ui?.canPay && (
                <div
                  style={{
                    margin: "8px 24px",
                    background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
                    border: "1px solid #bbf7d0",
                    borderRadius: 16,
                    padding: "18px 20px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      color: "#166534",
                      fontWeight: 700,
                      fontSize: 14,
                      marginBottom: 6,
                    }}
                  >
                    <RiLoader4Line
                      size={18}
                      style={{
                        animation: "pp-spin .9s linear infinite",
                        color: "#22c55e",
                      }}
                    />
                    Đang chờ xác nhận thanh toán
                    <WaitingDots />
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "#16a34a",
                      fontWeight: 500,
                    }}
                  >
                    Hệ thống tự động cập nhật khi nhận được giao dịch
                  </p>
                  {timeLeft !== null && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 12,
                        fontWeight: 700,
                        color: timeLeft <= 60 ? "#ef4444" : "#94a3b8",
                        letterSpacing: 0.3,
                      }}
                    >
                      ⏱ Tự động hủy sau:{" "}
                      <strong>
                        {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
                        {String(timeLeft % 60).padStart(2, "0")}
                      </strong>
                    </p>
                  )}
                </div>
              )}

              {/* Paid banner */}
              {isPaid && (
                <div
                  style={{
                    margin: "8px 24px",
                    background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                    borderRadius: 16,
                    padding: "16px 20px",
                    textAlign: "center",
                    color: "#166534",
                    fontWeight: 700,
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <HiCheckCircle size={22} color="#16a34a" />
                  Thanh toán đã được xác nhận
                </div>
              )}
            </>
          )}

          {/* ── Footer buttons ── */}
          <div
            style={{
              padding: "14px 24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {data.payment?.checkoutUrl && !isPaid && (
              <a
                href={data.payment.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#fff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "14px 0",
                  textAlign: "center",
                  color: "#6366f1",
                  fontWeight: 700,
                  textDecoration: "none",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all .2s ease",
                  letterSpacing: 0.2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.background = "#f5f3ff";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <HiArrowTopRightOnSquare size={16} />
                Mở trang thanh toán PayOS
              </a>
            )}
            <Link
              to="/dashboard"
              style={{
                background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
                borderRadius: 14,
                padding: "15px 0",
                textAlign: "center",
                color: "#475569",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all .2s ease",
                letterSpacing: 0.2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, #e2e8f0, #cbd5e1)";
                e.currentTarget.style.color = "#1e293b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, #f1f5f9, #e2e8f0)";
                e.currentTarget.style.color = "#475569";
              }}
            >
              <HiXMark size={16} />
              Đóng
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
