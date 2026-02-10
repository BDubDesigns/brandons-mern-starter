import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext"; // Import the useAuth hook to access authentication functions and state from AuthContext
import { Button } from "../components/Button";
import { FormInput } from "../components/FormInput";
import { PageCard } from "../components/PageCard";
import { getFieldErrors } from "../utils/getFieldErrors";

export const Login = () => {
  // Local state for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // call useAuth once and save the returned context value to avoid multiple calls and potential performance issues
  const auth = useAuth();
  // useNavigate hook from react-router to programmatically navigate after successful login
  const navigate = useNavigate();

  // useEffect to redirect to dashboard after successful login (when auth.token changes from null to a valid token)
  // We check for auth.token instead of auth.user because the token is what actually indicates whether the user is authenticated, and it will be set immediately upon successful login, while the user data may take a moment to fetch and update in the context
  useEffect(() => {
    if (auth.token && !auth.loading) {
      navigate("/dashboard");
    }
  }, [auth.token, auth.loading, navigate]); // we include navigate in the dependency array to avoid potential issues with stale closures, even though navigate is stable from useNavigate

  // useEffect to clear errors on mount
  useEffect(() => {
    auth.clearError();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the default form submission behavior which would cause a page reload
    await auth.login(email, password); // Call the login function from AuthContext with the email and password from the form inputs
  };

  // Show loading while checking if user is already logged in
  if (auth.loading) {
    console.log("loading");
    return <div>Loading...</div>;
  }

  // If user is already logged in, show redirect message
  if (auth.token) {
    console.log("redirecting");
    return <div>Redirecting...</div>;
  }
  return (
    <PageCard title="Login Page" subtitle="Enter your credentials to log in.">
      <form onSubmit={handleLogin}>
        <fieldset>
          <legend className="pb-4 text-2xl font-semibold">
            Enter your credentials
          </legend>

          <FormInput
            type="email"
            name="email"
            label="Email"
            errors={getFieldErrors("email", auth.error?.errors)}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />
          <FormInput
            type="password"
            name="password"
            label="Password"
            errors={getFieldErrors("password", auth.error?.errors)}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          {auth.error && (
            <p className="text-text-error">{auth.error.message}</p>
          )}
          {auth.error?.errors &&
            auth.error.errors.map((err, index) => (
              <p key={index} className="text-text-error">
                {err.msg}
              </p>
            ))}
          <div className="flex justify-center pb-4">
            <Button className="w-full" type="submit" loading={auth.loading}>
              Login
            </Button>
          </div>
        </fieldset>
      </form>
    </PageCard>
  );
};
