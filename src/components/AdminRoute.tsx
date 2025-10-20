import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-sm opacity-70">Loading…</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}
