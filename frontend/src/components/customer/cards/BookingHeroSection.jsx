import { Container } from "react-bootstrap";

export default function BookingHeroSection() {
  return (
    <section className="py-5 bg-primary text-white">
      <Container>
        <div className="text-center">
          <div className="mb-3">
            <i className="bi bi-calendar-plus display-6"></i>
          </div>
          <h1 className="display-5 fw-bold mb-3">Đặt chỗ ngồi online</h1>
          <p className="lead mb-0">
            Chọn thời gian và loại chỗ ngồi phù hợp cho việc học tập, làm việc
          </p>
        </div>
      </Container>
    </section>
  );
}
