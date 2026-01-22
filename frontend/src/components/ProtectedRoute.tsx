import { ReactNode, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { loading, token } = useAuth();
  const navigate = useNavigate();
  // useEffect: On component mount and whenever loading/token changes, check if user is authenticated
  useEffect(() => {
    if (!loading && !token) {
      navigate("/login");
    }
  }, [loading, token, navigate]); // we include navigate in the dependency array to avoid potential issues with stale closures, even though navigate is stable from useNavigate

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    // Explicitly return null to prevent rendering the protected content while redirecting
    return null; // We don't have to write null, but it makes it clear that we're intentionally not rendering anything here while redirecting to the login page
  }

  return children;
};
