import { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "@clerk/react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
