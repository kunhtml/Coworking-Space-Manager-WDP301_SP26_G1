const BASE = process.env.API_BASE || "http://127.0.0.1:5000/api";

async function req(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

async function tryLogin(identifier, password) {
  const r = await req("POST", "/auth/login", { body: { identifier, password } });
  return {
    identifier,
    status: r.status,
    ok: r.ok,
    token: r.data?.token || null,
    user: r.data?.user || null,
    message: r.data?.message || null,
  };
}

function result(name, role, status, expect, details = null) {
  return { name, role, status, expect, pass: expect.includes(status), details };
}

(async () => {
  const out = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    auth: {},
    tests: [],
    entities: {},
  };

  const adminCandidates = ["admin@coworking.com", "admin@workcafe.com"];
  let adminLogin = null;
  for (const email of adminCandidates) {
    const r = await tryLogin(email, "123456");
    if (!adminLogin) adminLogin = r;
    if (r.ok) {
      adminLogin = r;
      break;
    }
  }

  const staffLogin = await tryLogin("staff1@coworking.com", "123456");
  const customerLogin = await tryLogin("customer@gmail.com", "123456");

  out.auth = {
    admin: adminLogin,
    staff: staffLogin,
    customer: customerLogin,
  };

  const adminToken = adminLogin.token;
  const staffToken = staffLogin.token;
  const customerToken = customerLogin.token;

  // Guest
  const guestMenu = await req("GET", "/menu/items");
  out.tests.push(result("GET /menu/items", "guest", guestMenu.status, [200]));
  const guestTables = await req("GET", "/tables");
  out.tests.push(result("GET /tables", "guest", guestTables.status, [200]));
  const guestProtected = await req("GET", "/auth/me");
  out.tests.push(result("GET /auth/me", "guest", guestProtected.status, [401]));

  if (customerToken) {
    const me = await req("GET", "/auth/me", { token: customerToken });
    out.tests.push(result("GET /auth/me", "customer", me.status, [200]));

    const sendOtp = await req("POST", "/auth/send-otp", {
      token: customerToken,
      body: { purpose: "CHANGE_PASSWORD" },
    });
    out.tests.push(result("POST /auth/send-otp", "customer", sendOtp.status, [200, 500]));

    const verifyOtp = await req("POST", "/auth/verify-otp", {
      token: customerToken,
      body: { purpose: "CHANGE_PASSWORD", otp: "000000" },
    });
    out.tests.push(result("POST /auth/verify-otp (invalid)", "customer", verifyOtp.status, [400]));

    const date = "2099-12-30";
    const availableTables = await req("POST", "/tables/available", {
      body: {
        date,
        startTime: "09:00",
        endTime: "11:00",
      },
    });
    const availableList = availableTables.data?.tables || availableTables.data || [];
    const tableId = Array.isArray(availableList) && availableList.length
      ? (availableList[0].id || availableList[0]._id)
      : null;
    out.entities.tableId = tableId || null;

    if (tableId) {
      const bookingCreate = await req("POST", "/bookings", {
        token: customerToken,
        body: {
          tableId,
          date,
          startTime: "09:00",
          endTime: "11:00",
          pricePerHour: 50000,
          guestName: "QA Customer",
          guestPhone: "0900000000",
        },
      });
      out.tests.push(result("POST /bookings", "customer", bookingCreate.status, [201]));

      const bookingId = bookingCreate.data?.bookingId;
      out.entities.bookingId = bookingId || null;

      if (bookingId) {
        const bookingUpdate = await req("PATCH", `/bookings/${bookingId}`, {
          token: customerToken,
          body: {
            date,
            startTime: "10:00",
            endTime: "12:00",
            guestName: "QA Customer Updated",
            guestPhone: "0900000001",
          },
        });
        out.tests.push(result("PATCH /bookings/:id", "customer", bookingUpdate.status, [200]));

        const createOrder = await req("POST", "/orders", {
          token: customerToken,
          body: {
            bookingId,
            items: [{ menuItemId: guestMenu.data?.[0]?._id, quantity: 1 }],
          },
        });
        out.tests.push(result("POST /orders", "customer", createOrder.status, [201]));

        const orderId = createOrder.data?.orderId;
        out.entities.orderId = orderId || null;

        if (orderId) {
          const updOrder = await req("PUT", `/orders/${orderId}`, {
            token: customerToken,
            body: { items: [{ menuItemId: guestMenu.data?.[0]?._id, quantity: 2 }] },
          });
          out.tests.push(result("PUT /orders/:id", "customer", updOrder.status, [200]));

          const orderPayData = await req("GET", `/payments/order/${orderId}`, { token: customerToken });
          out.tests.push(result("GET /payments/order/:orderId", "customer", orderPayData.status, [200]));

          const createOrderPay = await req("POST", "/payments/create-order", {
            token: customerToken,
            body: { orderId },
          });
          out.tests.push(result("POST /payments/create-order", "customer", createOrderPay.status, [200, 400]));

          if (staffToken) {
            const staffUpdate = await req("PUT", `/staff/dashboard/orders/${orderId}`, {
              token: staffToken,
              body: {
                status: "CONFIRMED",
                items: [{ menuItemId: guestMenu.data?.[0]?._id, quantity: 2 }],
              },
            });
            out.tests.push(result("PUT /staff/dashboard/orders/:id CONFIRMED", "staff", staffUpdate.status, [200]));

            const staffCash = await req("POST", "/staff/payment/counter", {
              token: staffToken,
              body: { orderId, method: "CASH" },
            });
            out.tests.push(result("POST /staff/payment/counter CASH", "staff", staffCash.status, [200]));
          }
        }

        if (staffToken) {
          const checkin = await req("PATCH", `/bookings/${bookingId}/checkin`, { token: staffToken });
          out.tests.push(result("PATCH /bookings/:id/checkin", "staff", checkin.status, [200, 400]));
        }
      }
    }
  }

  if (staffToken) {
    const staffOrders = await req("GET", "/staff/dashboard/orders", { token: staffToken });
    out.tests.push(result("GET /staff/dashboard/orders", "staff", staffOrders.status, [200]));

    const allBookings = await req("GET", "/bookings/all", { token: staffToken });
    out.tests.push(result("GET /bookings/all", "staff", allBookings.status, [200]));
  }

  if (adminToken) {
    const users = await req("GET", "/users", { token: adminToken });
    out.tests.push(result("GET /users", "admin", users.status, [200]));

    const reportA = await req("GET", "/reports/analytics", { token: adminToken });
    out.tests.push(result("GET /reports/analytics", "admin", reportA.status, [200]));

    const reportH = await req("GET", "/reports/analytics/hourly", { token: adminToken });
    out.tests.push(result("GET /reports/analytics/hourly", "admin", reportH.status, [200]));
  }

  if (staffToken) {
    const reportDenied = await req("GET", "/reports/analytics", { token: staffToken });
    out.tests.push(result("GET /reports/analytics", "staff", reportDenied.status, [403]));
  }

  const summary = out.tests.reduce(
    (acc, t) => {
      acc.total += 1;
      if (t.pass) acc.passed += 1;
      else acc.failed += 1;
      return acc;
    },
    { total: 0, passed: 0, failed: 0 },
  );

  out.summary = summary;
  console.log(JSON.stringify(out, null, 2));
})();
