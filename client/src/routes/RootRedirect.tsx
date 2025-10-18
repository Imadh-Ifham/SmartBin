import { Navigate } from "react-router-dom";
import { useMe } from "../api/auth/useAuth";
import { PageSkeleton } from "../components/LoadingSkeleton";

export default function RootRedirect() {
  const lsToken =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { data, isLoading } = useMe();
  if (lsToken && isLoading) return <PageSkeleton />;
  const isAuthed = !!lsToken || !!data;
  return <Navigate to={isAuthed ? "/home" : "/login"} replace />;
}
