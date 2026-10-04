import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute";

import TransactionHistoryScreen from "./screens/TransactionHistoryScreen";
import KYCScreen from "./screens/KYCScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import WalletScreen from "./screens/WalletLookupScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import VerificationResultScreen from "./screens/VerificationResultScreen";
import SendTransactionScreen from "./screens/SendTransactionScreen";
import ReceiveTransactionScreen from "./screens/ReceiveTransactionScreen";
import DashboardScreen from "./screens/DashboardScreen";
import KYCReviewScreen from "./screens/KYCReviewScreen";
import SecuritySettingsScreen from "./screens/SecuritySettingsScreen";
import EscrowScreen from "./screens/EscrowScreen";

function App() {
  return (
    <Router>
      <Routes>

        {/* ================= PUBLIC ROUTES ================= */}

        <Route
          path="/"
          element={<WelcomeScreen />}
        />

        <Route
          path="/login"
          element={<LoginScreen />}
        />

        <Route
          path="/register"
          element={<RegisterScreen />}
        />


        {/* ================= DASHBOARD ================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardScreen />
            </ProtectedRoute>
          }
        />


        {/* ================= KYC ================= */}

        <Route
          path="/kyc"
          element={
            <ProtectedRoute>
              <KYCScreen />
            </ProtectedRoute>
          }
        />


        {/* ================= SECURITY (PASSKEYS) ================= */}

        <Route
          path="/security"
          element={
            <ProtectedRoute>
              <SecuritySettingsScreen />
            </ProtectedRoute>
          }
        />


        {/* ================= INTERNAL KYC REVIEW ================= */}

        <Route
          path="/internal/kyc-review"
          element={
            <ProtectedRoute>
              <KYCReviewScreen />
            </ProtectedRoute>
          }
        />


        {/* ================= WALLET ================= */}

        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <WalletScreen />
            </ProtectedRoute>
          }
        />


        {/* ================= TRANSACTIONS ================= */}

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <TransactionHistoryScreen />
            </ProtectedRoute>
          }
        />


        {/* ================= SEND ================= */}

        <Route
          path="/send"
          element={
            <ProtectedRoute>
              <SendTransactionScreen />
            </ProtectedRoute>
          }
        />

        <Route
           path="/escrow"
           element={
              <ProtectedRoute>
                <EscrowScreen />
                </ProtectedRoute>
              }
            />
        {/* ================= RECEIVE ================= */}

        <Route
          path="/receive"
          element={
            <ProtectedRoute>
              <ReceiveTransactionScreen />
            </ProtectedRoute>
          }
        />


        {/* ================= VERIFICATION RESULT ================= */}

        <Route
          path="/verification-result"
          element={<VerificationResultScreen />}
        />


        {/* ================= 404 ================= */}

        <Route
          path="*"
          element={
            <div
              style={{
                textAlign: "center",
                marginTop: "100px",
                fontFamily: "sans-serif",
              }}
            >
              <h1>404</h1>
              <h3>Page Not Found</h3>
            </div>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;