import { Outlet } from "react-router";
import AccessDenied from "./AccessDenied";
import { useAuth } from "../../context/AuthContext";

export default function AdminOnlyRoute() {
  const { session } = useAuth();
  const role = session?.user?.role || "editor";

  if (role !== "admin") {
    return <AccessDenied />;
  }

  return <Outlet />;
}
