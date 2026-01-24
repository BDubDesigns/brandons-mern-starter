import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext"; // Import the useAuth hook to access authentication functions and state from AuthContext

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

  // Handle form submission for registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the default form submission behavior which would cause a page reload
    setValidationError(null);
    // check that password and confirmPassword match before calling register
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

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
    <form onSubmit={handleRegister}>
      <h1>Register Page</h1>
      <h3>Create a new account.</h3>
      Name:{" "}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <br />
      Email:{" "}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      Password:{" "}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      Confirm Password:{" "}
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <br />
      {auth.error && (
        <p style={{ fontWeight: "bold", color: "red" }}>{auth.error.message}</p>
      )}
      {auth.error?.errors &&
        auth.error.errors.map((err, index) => (
          <p key={index} style={{ color: "red" }}>
            {err.msg}
          </p>
        ))}
      <button type="submit" disabled={auth.loading}>
        {auth.loading ? "Registering..." : "Register"}
      </button>
    </form>
  );
};
