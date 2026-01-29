import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// Define interface for form error states
interface FormError {
  message: string;
  errors?: Array<{ msg: string; path: string }>;
}

export const Profile = () => {
  const auth = useAuth();

  // password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordError, setPasswordError] = useState<FormError | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // email form state
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    password: "",
  });
  const [emailError, setEmailError] = useState<FormError | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // password form handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault(); // prevent default form submission behavior
    setPasswordError(null); // clear previous errors
    setPasswordSuccess(false); // reset success state
    // frontend validation: confirm passwords match here before calling backend
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError({ message: "New passwords do not match" });
      return;
    }

    setPasswordLoading(true);
    try {
      await auth.updatePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      // success - reset form and show success message
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setPasswordSuccess(true);
    } catch (error) {
      setPasswordError(error as FormError); // we use as to cast the error to FormError type, because we know the backend sends errors in that format
    } finally {
      setPasswordLoading(false);
    }
  };

  // email form handler
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault(); // prevent default form submission behavior
    setEmailError(null); // clear previous errors
    setEmailSuccess(false); // reset success state
    setEmailLoading(true);
    try {
      await auth.updateEmail(emailForm.newEmail, emailForm.password);
      // success - reset form and show success message
      setEmailForm({
        newEmail: "",
        password: "",
      });
      setEmailSuccess(true);
    } catch (error) {
      setEmailError(error as FormError);
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl">
        <span className="font-semi-bold">{auth.user?.name}</span>'s Profile Page
      </h1>
      <section>
        <h2 className="text-xl font-semibold">Change Password</h2>
        <form onSubmit={handlePasswordChange}>
          <label>
            Current Password:
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
            />
          </label>
          <br />
          <label>
            New Password:
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
            />
          </label>
          <br />
          <label>
            Confirm New Password:
            <input
              type="password"
              value={passwordForm.confirmNewPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmNewPassword: e.target.value,
                })
              }
            />
          </label>
          <br />
          {passwordError && (
            <p style={{ fontWeight: "bold", color: "red" }}>
              {passwordError.message}
            </p>
          )}
          {passwordError?.errors &&
            passwordError.errors.map((err, index) => (
              <p key={index} style={{ color: "red" }}>
                {err.msg}
              </p>
            ))}
          {passwordSuccess && (
            <div style={{ color: "green" }}>Password updated successfully!</div>
          )}
          <button type="submit" disabled={passwordLoading}>
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Change Email</h2>
        <form onSubmit={handleEmailChange}>
          <p>Current Email: {auth.user?.email}</p>
          <label>
            New Email:
            <input
              type="email"
              value={emailForm.newEmail}
              onChange={(e) =>
                setEmailForm({ ...emailForm, newEmail: e.target.value })
              }
            />
          </label>
          <br />
          <label>
            Password:
            <input
              type="password"
              value={emailForm.password}
              onChange={(e) =>
                setEmailForm({ ...emailForm, password: e.target.value })
              }
            />
          </label>
          <br />
          {emailError && (
            <p style={{ fontWeight: "bold", color: "red" }}>
              {emailError.message}
            </p>
          )}
          {emailError?.errors &&
            emailError.errors.map((err, index) => (
              <p key={index} style={{ color: "red" }}>
                {err.msg}
              </p>
            ))}
          {emailSuccess && (
            <div style={{ color: "green" }}>Email updated successfully!</div>
          )}
          <button type="submit" disabled={emailLoading}>
            {emailLoading ? "Updating..." : "Update Email"}
          </button>
        </form>
      </section>
    </div>
  );
};
