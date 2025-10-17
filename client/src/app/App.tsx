import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import { AdminLayout, CollectorLayout, UserLayout } from "../layouts";
import RequireAdmin from "../components/RequireAdmin";
import ErrorBoundary from "../components/ErrorBoundary";
import TrackerPage from "../modules/collector/pages/TrackerPage";
import ScannerPage from "../modules/collector/pages/ScannerPage";
import {
  PolicyDetails,
  PolicyAdminPage,
  AdminPoliciesPage,
  PolicyReviewPage,
} from "../modules/policies";
import PolicyFormPage from "../modules/policies/pages/PolicyFormPage";
import DashboardPage from "../pages/admin/DashboardPage";
import HomePage from "../pages/HomePage";
import LoginPage from "../modules/auth/LoginPage";
import UsersPage from "../pages/admin/UsersPage";
import ReportsPage from "../pages/admin/ReportsPage";
import SettingsPage from "../pages/admin/SettingsPage";
import ProfilePage from "../pages/ProfilePage";
import RequestsPage from "../pages/RequestsPage";
import NotificationsPage from "../pages/NotificationsPage";
import SmartBin from "../modules/smart-bin/pages/SmartBin";
import ManagePayment from "../modules/payment/pages/ManagePayment";

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<UserLayout />}>
            {/* Home page as default landing */}
            <Route index element={<HomePage />} />
            <Route path="home" element={<HomePage />} />
            <Route path="policies">
              <Route index element={<PolicyAdminPage />} />
              <Route path=":id" element={<PolicyDetails />} />
            </Route>
            <Route path="payment" element={<ManagePayment />} />
          </Route>

          {/* Collector App Routes */}
          <Route path="/collector" element={<CollectorLayout />}>
            <Route index element={<Navigate to="tracker" />} />
            <Route path="tracker" element={<TrackerPage />} />
            <Route path="scanner" element={<ScannerPage />} />
          </Route>

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
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
