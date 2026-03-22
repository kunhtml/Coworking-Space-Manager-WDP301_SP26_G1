import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Table from "../models/table.js";
import Booking from "../models/booking.js";

dotenv.config();

const toDate = (value) => new Date(value);

const tablesSeed = [
  {
    _id: "65e6e0000000000000000001",
    name: "Ban chung Tang 1 - 01",
    tableType: "Hot_Desk",
    capacity: 1,
    status: "Available",
    pricePerHour: 20000,
    pricePerDay: 100000,
    createdAt: toDate("2026-01-01T08:00:00.000Z"),
  },
  {
    _id: "65e6e0000000000000000002",
    name: "Phong hop A",
    tableType: "Meeting_Room",
    capacity: 10,
    status: "Occupied",
    pricePerHour: 150000,
    pricePerDay: 1000000,
    createdAt: toDate("2026-01-01T08:00:00.000Z"),
  },
  {
    _id: "65e6e0000000000000000003",
    name: "Ban chung Tang 1 - 02",
    tableType: "Hot_Desk",
    capacity: 1,
    status: "Available",
    pricePerHour: 20000,
    pricePerDay: 100000,
    createdAt: toDate("2026-01-02T08:00:00.000Z"),
  },
  {
    _id: "65e6e0000000000000000004",
    name: "Ban nhom B1",
    tableType: "Group_Table",
    capacity: 4,
    status: "Available",
    pricePerHour: 60000,
    pricePerDay: 320000,
    createdAt: toDate("2026-01-02T08:30:00.000Z"),
  },
  {
    _id: "65e6e0000000000000000005",
    name: "Ban nhom B2",
    tableType: "Group_Table",
    capacity: 6,
    status: "Available",
    pricePerHour: 85000,
    pricePerDay: 450000,
    createdAt: toDate("2026-01-02T09:00:00.000Z"),
  },
  {
    _id: "65e6e0000000000000000006",
    name: "Phong hop C",
    tableType: "Meeting_Room",
    capacity: 8,
    status: "Available",
    pricePerHour: 120000,
    pricePerDay: 780000,
    createdAt: toDate("2026-01-03T08:00:00.000Z"),
  },
];

const USER_IDS = [
  "65e6b0000000000000000001",
  "65e6b0000000000000000002",
  "65e6b0000000000000000003",
  "65e6b0000000000000000004",
  "65e6b0000000000000000005",
  "65e6b0000000000000000006",
];

const SLOT_DEFS = [
  { start: 7, end: 9, weight: 0.55 },
  { start: 9, end: 11, weight: 0.65 },
  { start: 11, end: 13, weight: 0.7 },
  { start: 13, end: 15, weight: 0.82 },
  { start: 15, end: 17, weight: 0.9 },
  { start: 17, end: 19, weight: 0.75 },
];

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const seededRandom = (key) => {
  const x = Math.sin(hashString(key)) * 10000;
  return x - Math.floor(x);
};

const utcDate = (date, hour, minute = 0) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hour,
      minute,
      0,
      0,
    ),
  );

const dateKey = (date) =>
  `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;

const formatDate = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

const getMonthFactor = (monthIndex) => {
  if (monthIndex === 0) return 0.65;
  if (monthIndex === 1) return 0.78;
  return 0.92;
};

const getWeekdayFactor = (weekday) => {
  if (weekday === 0) return 0.55;
  if (weekday === 6) return 0.62;
  return 0.9;
};

const buildSyntheticBookings = (tables) => {
  const start = new Date(Date.UTC(2026, 0, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(2026, 2, 23, 23, 59, 59, 999));
  const docs = [];

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = new Date(d);
    const dailyFactor = getMonthFactor(day.getUTCMonth()) * getWeekdayFactor(day.getUTCDay());

    tables.forEach((table) => {
      SLOT_DEFS.forEach((slot, slotIndex) => {
        const noise = seededRandom(`${table._id}-${formatDate(day)}-${slotIndex}`);
        const shouldCreate = noise < dailyFactor * slot.weight;
        if (!shouldCreate) return;

        const minuteOffset = Math.floor(
          seededRandom(`offset-${table._id}-${formatDate(day)}-${slotIndex}`) * 3,
        ) * 10;

        const startTime = utcDate(day, slot.start, minuteOffset);
        const endTime = utcDate(day, slot.end, minuteOffset);

        const statusSeed = seededRandom(`status-${table._id}-${formatDate(day)}-${slotIndex}`);
        const status = statusSeed < 0.08 ? "Cancelled" : statusSeed < 0.68 ? "Confirmed" : "In_Use";

        const userSeed = seededRandom(`user-${table._id}-${formatDate(day)}-${slotIndex}`);
        const hasGuestInfo = userSeed < 0.22;
        const userId = hasGuestInfo
          ? undefined
          : USER_IDS[Math.floor(userSeed * USER_IDS.length)] || USER_IDS[0];

        const basePrice = Number(table.pricePerHour || 50000);
        const durationHours = slot.end - slot.start;
        const depositAmount = Math.max(20000, Math.round(basePrice * durationHours * 0.35));

        docs.push({
          bookingCode: `SEED-${dateKey(day)}-${String(table._id).slice(-4)}-${slot.start}${slot.end}`,
          userId,
          guestInfo: hasGuestInfo
            ? {
                name: `Khach ${String(table.name || "VangLai").replace(/\s+/g, " ")}`,
                email: `guest.${dateKey(day)}.${String(table._id).slice(-4)}@example.com`,
                phone: `09${String(hashString(`${table._id}-${dateKey(day)}`)).slice(0, 8)}`,
              }
            : undefined,
          tableId: table._id,
          startTime,
          endTime,
          status,
          depositAmount,
          createdAt: new Date(startTime.getTime() - 24 * 60 * 60 * 1000),
        });
      });
    });
  }

  return docs;
};

const run = async () => {
  await connectDB();

  await Table.deleteMany({
    _id: { $in: tablesSeed.map((table) => table._id) },
  });
  await Table.insertMany(tablesSeed);

  const tables = await Table.find({
    _id: { $in: tablesSeed.map((table) => table._id) },
  }).lean();

  const syntheticBookings = buildSyntheticBookings(tables);

  await Booking.deleteMany({ bookingCode: { $regex: /^SEED-/ } });
  await Booking.insertMany(syntheticBookings, { ordered: false });

  console.log("Seeded tables:", tablesSeed.length);
  console.log("Seeded bookings:", syntheticBookings.length);
  console.log("Date range:", "2026-01-01 -> 2026-03-23");
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
