import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext"; // Import the useAuth hook to access authentication functions and state from AuthContext
// import FormInput and FormButton components
import { FormInput } from "../components/FormInput";
import { FormButton } from "../components/FormButton";

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
    <div className="bg-surface mr-auto ml-auto flex max-w-xl flex-col items-center justify-center rounded-xl p-4">
      <h1 className="text-3xl font-bold underline">Register Page</h1>
      <h3 className="my-4 text-xl">Create a new account.</h3>
      <form onSubmit={handleRegister}>
        <fieldset>
          <legend className="pb-4 text-2xl font-semibold">
            Enter your details
          </legend>
          <FormInput
            type="text"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <br />
          <FormInput
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <br />
          <FormInput
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <br />
          <FormInput
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <br />
          {auth.error && (
            <p className="text-text-error" style={{ fontWeight: "bold" }}>
              {auth.error.message}
            </p>
          )}
          {auth.error?.errors &&
            auth.error.errors.map((err, index) => (
              <p key={index} className="text-text-error">
                {err.msg}
              </p>
            ))}
          <div className="flex justify-center pt-2 pb-4">
            <FormButton type="submit" loading={auth.loading}>
              Register
            </FormButton>
          </div>
        </fieldset>
      </form>
    </div>
  );
};
