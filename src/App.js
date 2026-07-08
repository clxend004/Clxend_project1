import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import TransactionHistoryScreen from "./screens/TransactionHistoryScreen";
import KYCScreen from "./screens/KYCScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import WalletScreen from "./screens/WalletLookupScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import KYCUpload from "./pages/KYCUpload";
import KYCStatus from "./pages/KYCStatus";
import VerificationResultScreen from "./screens/VerificationResultScreen";
import SendTransactionScreen from "./screens/SendTransactionScreen";
import ReceiveTransactionScreen from "./screens/ReceiveTransactionScreen";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route
  path="/kyc"
  element={
    <ProtectedRoute>
      <KYCScreen />
    </ProtectedRoute>
  }
/>
        <Route path="/wallet" element={<WalletScreen />} />
        <Route
  path="/transactions"
  element={
    <ProtectedRoute>
      <TransactionHistoryScreen />
    </ProtectedRoute>
  }
/>

        {/* Optional pages */}
        <Route path="/kyc-upload" element={<KYCUpload />} />
        <Route path="/kyc-status" element={<KYCStatus />} />

        <Route path="/verification-result" element={<VerificationResultScreen />} />
        <Route
  path="/send"
  element={
    <ProtectedRoute>
      <SendTransactionScreen />
    </ProtectedRoute>
  }
/>
        <Route
  path="/receive"
  element={
    <ProtectedRoute>
      <ReceiveTransactionScreen />
    </ProtectedRoute>
  }
/>
      </Routes>
    </Router>
  );
}

export default App;