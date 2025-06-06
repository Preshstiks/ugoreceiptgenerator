import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const UnauthenticatedRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
