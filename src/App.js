import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import TransactionHistoryScreen from "./screens/TransactionHistoryScreen";
import KYCScreen from "./screens/KYCScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import WalletScreen from "./screens/WalletLookupScreen";
import WelcomeScreen from "./screens/WelcomeScreen";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/kyc" element={<KYCScreen />} />
        <Route path="/wallet" element={<WalletScreen />} />
        <Route path="/transactions" element={<TransactionHistoryScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
