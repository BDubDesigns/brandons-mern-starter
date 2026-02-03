import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext"; // Import the useAuth hook to access authentication functions and state from AuthContext

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
    <div className="bg-surface mr-auto ml-auto flex max-w-md flex-col items-center justify-center rounded-lg p-4">
      <h1 className="text-3xl font-bold underline">Login Page</h1>
      <h3 className="my-4 text-xl">Enter your credentials to log in.</h3>
      <form onSubmit={handleLogin}>
        <fieldset className="rounded-lg border">
          <legend>Login Credentials</legend>
          Email:{" "}
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />
          Password:{" "}
          <input
            type="password"
            name="password"
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
          <button
            type="submit"
            disabled={auth.loading}
            className="bg-interactive border-border text-text hover:bg-interactive-hover rounded border-2 px-4 py-2 font-semibold"
          >
            {auth.loading ? "Logging in..." : "Login"}
          </button>
        </fieldset>
      </form>
    </div>
  );
};
