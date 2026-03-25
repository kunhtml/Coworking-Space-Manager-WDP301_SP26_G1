import { Row } from "react-bootstrap";
import BookingCard from "./BookingCard";

export default function StaffBookingTable({
  data,
  statusStyle,
  statusLabel,
  fmtDate,
  fmtTime,
  fmtCur,
  checkingId,
  now,
  onCheckin,
  onViewDetail,
}) {
  return (
    <Row className="g-3">
      {data.map((booking) => {
        const st = statusStyle[booking.status] || { color: "#475569" };
        const isExpired = booking.endTime && new Date(booking.endTime) < (now || new Date());
        const canCheckIn =
          ["Confirmed", "Awaiting_Payment"].includes(booking.status) && !isExpired;
        return (
          <BookingCard
            key={String(booking.id)}
            booking={booking}
            statusStyle={st}
            statusLabel={statusLabel[booking.status] || booking.status}
            fmtDate={fmtDate}
            fmtTime={fmtTime}
            fmtCur={fmtCur}
            canCheckIn={canCheckIn}
            isExpired={isExpired}
            isChecking={checkingId === String(booking.id)}
            onCheckin={onCheckin}
            onViewDetail={onViewDetail}
          />
        );
      })}
    </Row>
  );
}

