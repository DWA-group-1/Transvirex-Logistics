import { Button, Container, Navbar } from "react-bootstrap";

function App() {
  return (
    <Container>
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand>Transvirex Logistics</Navbar.Brand>
      </Navbar>
      <i className="bi bi-house" />
      <Button variant="primary">Click me</Button>
    </Container>
  );
}

export default App;
