import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext"; // Import the useAuth hook to access authentication functions and state from AuthContext
// import FormInput, PageCard, and Button components
import { FormInput } from "../components/FormInput";
import { Button } from "../components/Button";
import { PageCard } from "../components/PageCard";
import { getFieldErrors } from "../utils/getFieldErrors";

export const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  // call useAuth once and save the returned context value to avoid multiple calls and potential performance issues
  const auth = useAuth();
  // useNavigate hook from react-router to programmatically navigate after successful registration
  const navigate = useNavigate();

  // useEffect to redirect to dashboard after successful registration (when auth.token changes from null to a valid token)
  useEffect(() => {
    if (auth.token && !auth.loading) {
      navigate("/dashboard");
    }
  }, [auth.token, auth.loading, navigate]); // we include navigate in the dependency array to avoid potential issues with stale closures, even though navigate is stable from useNavigate

  // useEffect to clear errors on mount
  useEffect(() => {
    auth.clearError();
  }, []);

  // Handle form submission for registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the default form submission behavior which would cause a page reload
    setValidationError(null);
    // check that password and confirmPassword match before calling register
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }
    console.log("registering");
    await auth.register(name, email, password); // Call the register function from AuthContext with the form inputs
  };

  // If loading, show a loading indicator
  if (auth.loading) {
    console.log("loading");
    return <div>Loading...</div>;
  }

  // So that we don't show the registration form if the user is already logged in, we check
  //  if auth.token exists and show a redirecting message. useEffect above will handle the actual redirect.
  if (auth.token) {
    console.log("redirecting");
    return <div>Redirecting...</div>;
  }

  return (
    <PageCard title="Register Page" subtitle="Create a new account.">
      {validationError && (
        <p className="text-text-error font-bold">{validationError}</p>
      )}
      <form onSubmit={handleRegister}>
        <fieldset>
          <legend className="pb-4 text-2xl font-semibold">
            Enter your details
          </legend>
          <FormInput
            type="text"
            label="Name"
            errors={getFieldErrors("name", auth.error?.errors)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <FormInput
            type="email"
            label="Email"
            errors={getFieldErrors("email", auth.error?.errors)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormInput
            type="password"
            label="Password"
            errors={getFieldErrors("password", auth.error?.errors)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FormInput
            type="password"
            label="Confirm Password"
            errors={getFieldErrors("confirmPassword", auth.error?.errors)}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {auth.error && !auth.error.errors && (
            <p className="text-text-error font-bold">{auth.error.message}</p>
          )}
          <div className="flex justify-center pt-2 pb-4">
            <Button type="submit" className="w-full" loading={auth.loading}>
              Register
            </Button>
          </div>
        </fieldset>
      </form>
    </PageCard>
  );
};
