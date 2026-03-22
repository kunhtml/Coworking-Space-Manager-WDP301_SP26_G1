# Seed data for hourly occupancy analytics

Updated files:

- `DATABASE/tables.json`
- `DATABASE/bookings.json`

## Added tables

- `65e6e0000000000000000003` - Ban chung Tang 1 - 02 (Hot_Desk, capacity 1)
- `65e6e0000000000000000004` - Ban nhom B1 (Group_Table, capacity 4)
- `65e6e0000000000000000005` - Ban nhom B2 (Group_Table, capacity 6)
- `65e6e0000000000000000006` - Phong hop C (Meeting_Room, capacity 8)

## Added bookings (focus date: 2026-03-23)

- `BK-2001` (07:30-09:30) table `...0004`
- `BK-2002` (09:00-12:00) table `...0002`
- `BK-2003` (11:00-14:00) table `...0005`
- `BK-2004` (13:00-16:30) table `...0006`
- `BK-2005` (14:00-18:00) table `...0002`
- `BK-2006` (17:00-18:30) table `...0004`

These records are suitable for testing endpoint:

- `GET /api/reports/analytics/hourly?date=2026-03-23`
