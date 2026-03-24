const BASE = "http://127.0.0.1:5000/api";

async function call(method, path, token, body) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

const login = await call("POST", "/auth/login", null, {
  identifier: "customer@gmail.com",
  password: "123456",
});
const token = login.data?.token;

const tables = await call("GET", "/tables");
const menu = await call("GET", "/menu/items");
const tableId = tables.data?.[0]?.id || tables.data?.[0]?._id;
const menuId = menu.data?.[0]?._id;

const now = new Date();
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate() + 2).padStart(2, "0")}`;

const booking = await call("POST", "/bookings", token, {
  tableId,
  date,
  startTime: "08:00",
  endTime: "10:00",
  pricePerHour: 50000,
});

const order = await call("POST", "/orders", token, {
  bookingId: booking.data?.bookingId,
  items: [{ menuItemId: menuId, quantity: 1 }],
});

const pay = await call("POST", "/payments/create-order", token, {
  orderId: order.data?.orderId,
});

console.log(JSON.stringify({ booking, order, pay }, null, 2));
