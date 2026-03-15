import { ReactNode } from "react";
import { RedirectToSignIn, useAuth } from "@clerk/react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoaded, isSignedIn } = useAuth(); // Check if the auth state is loaded and if the user is signed in

  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  if (!isSignedIn) {
    // If the user is not signed in, redirect to the sign-in page
    return <RedirectToSignIn />;
  }

  return children;
};
