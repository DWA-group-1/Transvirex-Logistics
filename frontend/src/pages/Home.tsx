import { Col, Container, Row } from "react-bootstrap";

function Home() {
  return (
    <Container fluid className="p-4">
      <Row>
        <Col>
          <h1 className="mb-4" style={{ color: "var(--font-color)" }}>
            Dashboard
          </h1>

          <Row>
            <DashboardCard
              icon="bi bi-speedometer2"
              title="Overview"
              text="Logistics dashboard."
            />

            <DashboardCard
              icon="bi bi-truck"
              title="Track Orders"
              text="Monitor your shipments in real-time."
            />

            <DashboardCard
              icon="bi bi-map"
              title="Plan Routes"
              text="Optimize delivery routes efficiently."
            />
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

function DashboardCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <Col md={4} className="mb-4">
      <div
        className="card h-100"
        style={{
          background: "var(--selected-color)",
          color: "var(--font-color)",
          border: "1px solid color-mix(in srgb, var(--font-color) 16%, transparent)",
          borderRadius: 8,
        }}
      >
        <div className="card-body">
          <h5 className="card-title">
            <i className={`${icon} me-2`} />
            {title}
          </h5>

          <p
            className="card-text"
            style={{
              color: "color-mix(in srgb, var(--font-color) 82%, transparent)",
            }}
          >
            {text}
          </p>
        </div>
      </div>
    </Col>
  );
}

export default Home;