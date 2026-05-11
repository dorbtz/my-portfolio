import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth.helpers";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-6 text-sm opacity-70">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
