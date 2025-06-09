import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { Login } from "./authPage/Login";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { GenerateReceipt } from "./pages/GenerateReceipt";
import { ReceiptsHistory } from "./pages/ReceiptsHistory";
import { PrintReceipt } from "./pages/PrintReceipt";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UnauthenticatedRoute } from "./components/UnauthenticatedRoute";
import { Profile } from "./pages/Profile";
import { ScreenSizeRestriction } from "./components/ScreenSizeRestriction";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <ScreenSizeRestriction>
      <Routes>
        <Route
          path="/"
          element={
            <UnauthenticatedRoute>
              <Login />
            </UnauthenticatedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/dashboard/generate-receipt"
            element={<GenerateReceipt />}
          />
          <Route
            path="/dashboard/receipts-history"
            element={<ReceiptsHistory />}
          />
          <Route
            path="/dashboard/print-receipt/:receiptId"
            element={<PrintReceipt />}
          />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ScreenSizeRestriction>
  );
}

export default App;
