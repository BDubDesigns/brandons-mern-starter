import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface PasswordFormError {
  message: string;
  errors?: Array<{ msg: string; path: string }>;
}

interface EmailFormError {
  message: string;
  errors?: Array<{ msg: string; path: string }>;
}

export const Profile = () => {
  const auth = useAuth();

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordError, setPasswordError] = useState<PasswordFormError | null>(
    null
  );
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Email form state
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    password: "",
  });
  const [emailError, setEmailError] = useState<EmailFormError | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Password form handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    // Frontend validation: confirm passwords match
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
      // Success - reset form and show success message
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000); // Clear success after 3 seconds
    } catch (error) {
      // Error thrown from context - set error state
      const err = error as PasswordFormError;
      setPasswordError(err);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Email form handler
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(false);

    setEmailLoading(true);
    try {
      await auth.updateEmail(emailForm.newEmail, emailForm.password);
      // Success - reset form and show success message (token already updated in context)
      setEmailForm({ newEmail: "", password: "" });
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000); // Clear success after 3 seconds
    } catch (error) {
      // Error thrown from context - set error state
      const err = error as EmailFormError;
      setEmailError(err);
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div>
      <h1>Account Settings</h1>

      {/* Password Change Form */}
      <section>
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordChange}>
          <div>
            <label>Current Password:</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
              required
            />
          </div>
          <div>
            <label>New Password:</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
              required
            />
          </div>
          <div>
            <label>Confirm New Password:</label>
            <input
              type="password"
              value={passwordForm.confirmNewPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmNewPassword: e.target.value,
                })
              }
              required
            />
          </div>
          {passwordError && (
            <>
              <p style={{ color: "red", fontWeight: "bold" }}>
                {passwordError.message}
              </p>
              {passwordError.errors &&
                passwordError.errors.map((err, index) => (
                  <p key={index} style={{ color: "red" }}>
                    {err.msg}
                  </p>
                ))}
            </>
          )}
          {passwordSuccess && (
            <p style={{ color: "green", fontWeight: "bold" }}>
              Password updated successfully!
            </p>
          )}
          <button type="submit" disabled={passwordLoading}>
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>

      {/* Email Change Form */}
      <section>
        <h2>Change Email</h2>
        <p>Current email: {auth.user?.email}</p>
        <form onSubmit={handleEmailChange}>
          <div>
            <label>New Email:</label>
            <input
              type="email"
              value={emailForm.newEmail}
              onChange={(e) =>
                setEmailForm({ ...emailForm, newEmail: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label>Password (for verification):</label>
            <input
              type="password"
              value={emailForm.password}
              onChange={(e) =>
                setEmailForm({ ...emailForm, password: e.target.value })
              }
              required
            />
          </div>
          {emailError && (
            <>
              <p style={{ color: "red", fontWeight: "bold" }}>
                {emailError.message}
              </p>
              {emailError.errors &&
                emailError.errors.map((err, index) => (
                  <p key={index} style={{ color: "red" }}>
                    {err.msg}
                  </p>
                ))}
            </>
          )}
          {emailSuccess && (
            <p style={{ color: "green", fontWeight: "bold" }}>
              Email updated successfully!
            </p>
          )}
          <button type="submit" disabled={emailLoading}>
            {emailLoading ? "Updating..." : "Update Email"}
          </button>
        </form>
      </section>
    </div>
  );
};
