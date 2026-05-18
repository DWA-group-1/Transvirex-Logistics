import { useState } from "react";
import { Button, Col, Container, Nav, Offcanvas, Row } from "react-bootstrap";

{
  /*
  SHOWS THE MAIN dashboard after login. ADJUSTS TO MOBILE AND DESKTOP.
*/
}
function Home() {
  return (
    <>
      {/* Main Content Area - Full Width */}
      <Container fluid className="p-4">
        <Row>
          <Col>
            <h1 className="mb-4">Dashboard</h1>
            <div className="row">
              <div className="col-md-4 mb-4">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="bi bi-speedometer2 me-2"></i>
                      Overview
                    </h5>
                    <p className="card-text">Logistics dashboard.</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-4">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="bi bi-truck me-2"></i>
                      Track Orders
                    </h5>
                    <p className="card-text">
                      Monitor your shipments in real-time.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-4">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="bi bi-map me-2"></i>
                      Plan Routes
                    </h5>
                    <p className="card-text">
                      Optimize delivery routes efficiently.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Home;
