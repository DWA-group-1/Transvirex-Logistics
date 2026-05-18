/**
 * API Connection Test - Run this to verify backend connection
 * You can use this for debugging or integrate it into your app
 */

import { useState } from "react";
import { Container, Button, Alert, Spinner } from "react-bootstrap";
import { healthCheck, login, getCurrentUser } from "../services/api";

function TestConnection() {
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | null>(null);

  // TEST 1 - Health Check
  const testHealth = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const isHealthy = await healthCheck();
      if (isHealthy) {
        setStatus("success");
        setMessage("✅ Backend is healthy and running!");
      } else {
        setStatus("error");
        setMessage("❌ Backend returned an error");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(`❌ Connection failed: ${err.message}`);
    }
    setIsLoading(false);
  };

  // TEST 2 - Test Login (with test credentials)
  const testLogin = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      // Use test credentials - adjust as needed
      const testEmail = "test@example.com";
      const testPassword = "testpass123";

      const result = await login(testEmail, testPassword);
      setStatus("success");
      setMessage(
        `✅ Login successful! Token: ${result.access_token.substring(0, 20)}...`,
      );
    } catch (err: any) {
      setStatus("error");
      setMessage(`❌ Login failed: ${err.message}`);
    }
    setIsLoading(false);
  };

  // TEST 3 - Get Current User
  const testGetUser = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const user = await getCurrentUser();
      setStatus("success");
      setMessage(`✅ Got user: ${user.email}`);
    } catch (err: any) {
      setStatus("error");
      setMessage(`❌ Failed to get user: ${err.message}`);
    }
    setIsLoading(false);
  };

  return (
    <Container className="p-4 mt-5">
      <h1>API Connection Test</h1>
      <p className="text-muted mb-4">
        Use these buttons to test your backend connection
      </p>

      {/* STATUS MESSAGE */}
      {message && (
        <Alert
          variant={status === "success" ? "success" : "danger"}
          className="mb-4"
        >
          {message}
        </Alert>
      )}

      {/* TEST BUTTONS */}
      <div className="d-flex flex-column gap-2">
        <Button variant="primary" onClick={testHealth} disabled={isLoading}>
          {isLoading && <Spinner size="sm" className="me-2" />}
          Test 1: Health Check
        </Button>

        <Button variant="info" onClick={testLogin} disabled={isLoading}>
          {isLoading && <Spinner size="sm" className="me-2" />}
          Test 2: Test Login
        </Button>

        <Button variant="warning" onClick={testGetUser} disabled={isLoading}>
          {isLoading && <Spinner size="sm" className="me-2" />}
          Test 3: Get Current User
        </Button>
      </div>

      <hr className="my-4" />

      <h5>Testing Steps:</h5>
      <ol>
        <li>Click "Test 1" to check if backend is running</li>
        <li>If it fails, make sure your auth service is running</li>
        <li>
          Click "Test 2" to test login (uses test@example.com / testpass123)
        </li>
        <li>If login works, a token is stored and Test 3 will work</li>
        <li>
          Once all tests pass, your frontend-backend integration is working!
        </li>
      </ol>

      <div className="alert alert-info mt-4">
        <strong>Backend URL:</strong> http://localhost:8000
        <br />
        <strong>Token Storage:</strong> localStorage (authToken)
        <br />
        <strong>
          Make sure your backend Auth Service is running before testing!
        </strong>
      </div>
    </Container>
  );
}

export default TestConnection;
