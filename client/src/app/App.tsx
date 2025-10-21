import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import { AdminLayout } from "../layouts";
import RequireAdmin from "../components/RequireAdmin";
import ErrorBoundary from "../components/ErrorBoundary";
import ScannerPage from "../modules/collector/pages/ScannerPage";
import { AdminPoliciesPage, PolicyReviewPage } from "../modules/policies";
import PolicyFormPage from "../modules/policies/pages/PolicyFormPage";
import DashboardPage from "../pages/admin/DashboardPage";
import HomePage from "../pages/HomePage";

import UsersPage from "../pages/admin/UsersPage";
import ReportsPage from "../pages/admin/ReportsPage";
import SettingsPage from "../pages/admin/SettingsPage";
import ProfilePage from "../pages/ProfilePage";
import RequestsPage from "../pages/RequestsPage";
import NotificationsPage from "../pages/NotificationsPage";
import SmartBin from "../modules/smart-bin/pages/SmartBin";
import { LoginScreen, RegisterScreen } from "../modules/auth/screens";
import { userProtectedRoutes } from "../routes/ProtectedRoutes";
import RootRedirect from "../routes/RootRedirect";

const App = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Toaster position="top-right" />
        <Routes>
          {/* Auth first: make / route go to login */}
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/" element={<RootRedirect />} />
          {/* App routes under the user layout (protected) */}
          {userProtectedRoutes}

          {/* Collector App Routes */}
          <Route path="/collector" element={<ScannerPage />} />

          <Route path="/smart-bin" element={<SmartBin />} />

          {/* Admin routes (protected) */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Navigate to="home" />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="home" element={<HomePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route
              path="leads"
              element={<div className="p-4">SmartBin Leads Page</div>}
            />
            <Route path="policies">
              {/* Admin policy listing and CRUD */}
              <Route index element={<AdminPoliciesPage />} />
              <Route path="new" element={<PolicyFormPage />} />
              <Route path=":id">
                <Route index element={<PolicyReviewPage />} />
                <Route path="edit" element={<PolicyFormPage />} />
              </Route>
            </Route>
          </Route>

          {/* Top-level pages used by UserLayout */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
