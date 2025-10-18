import React from "react";
import { Navigate, Route } from "react-router-dom";
import { UserLayout } from "../layouts";
import HomePage from "../pages/HomePage";
import ManagePayment from "../modules/payment/pages/ManagePayment";
import { PolicyAdminPage, PolicyDetails } from "../modules/policies";
import { useMe } from "../api/auth/useAuth";
import { PageSkeleton } from "../components/LoadingSkeleton";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useMe();
  if (isLoading) return <PageSkeleton />;
  if (isError || !data) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ProtectedShell() {
  return (
    <RequireAuth>
      <UserLayout />
    </RequireAuth>
  );
}

export const userProtectedRoutes = (
  <>
    <Route path="/" element={<ProtectedShell />}>
      <Route path="home" element={<HomePage />} />
      <Route path="policies">
        <Route index element={<PolicyAdminPage />} />
        <Route path=":id" element={<PolicyDetails />} />
      </Route>
      <Route path="payment" element={<ManagePayment />} />
    </Route>
  </>
);
