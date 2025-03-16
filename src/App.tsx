import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastContextProvider } from "./contexts/ToastContext";
import Dashboard from "./pages/Dashboard";
import GroupDetails from "./pages/GroupDetails";
import Login from "./pages/Login";
import NewGroupExpense from "./pages/NewGroupExpense";
import Register from "./pages/Register";

function App() {
  return (
    <Router>
      <ToastContextProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId"
              element={
                <ProtectedRoute>
                  <GroupDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId/expense/new"
              element={
                <ProtectedRoute>
                  <NewGroupExpense />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastContextProvider>
    </Router>
  );
}

export default App;
