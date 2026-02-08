import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { PageCard } from "../components/PageCard";
import { FormInput } from "../components/FormInput";
import { Button } from "../components/Button";
import { Divider } from "../components/Divider";

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
        passwordForm.newPassword,
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
    <PageCard title="Profile Page" subtitle={`${auth.user?.name}'s Profile`}>
      <section>
        <form onSubmit={handlePasswordChange}>
          <fieldset>
            <legend className="mb-2 text-xl font-semibold">
              Change Password
            </legend>
            <FormInput
              type="password"
              label="Current Password"
              className="mb-2"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
            />
            <FormInput
              type="password"
              label="New Password"
              className="mb-2"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
            />
            <FormInput
              type="password"
              label="Confirm New Password"
              className="mb-2"
              value={passwordForm.confirmNewPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmNewPassword: e.target.value,
                })
              }
            />
            {passwordError && (
              <p className="text-text-error">{passwordError.message}</p>
            )}
            {passwordError?.errors &&
              passwordError.errors.map((err, index) => (
                <p key={index} className="text-text-error">
                  {err.msg}
                </p>
              ))}
            {passwordSuccess && (
              <div className="text-text-success">
                Password updated successfully!
              </div>
            )}
            <Button className="w-full" type="submit" loading={passwordLoading}>
              Update Password
            </Button>
          </fieldset>
        </form>
      </section>

      <Divider className="mt-6" />
      <section className="mt-6">
        <form onSubmit={handleEmailChange}>
          <fieldset>
            <legend className="mb-2 text-xl font-semibold">Change Email</legend>
            <p className="mb-2 text-base font-bold">
              Current Email: {auth.user?.email}
            </p>
            <FormInput
              type="email"
              label="New Email"
              className="mb-2"
              value={emailForm.newEmail}
              onChange={(e) =>
                setEmailForm({ ...emailForm, newEmail: e.target.value })
              }
            />
            <FormInput
              type="password"
              label="Password"
              className="mb-2"
              value={emailForm.password}
              onChange={(e) =>
                setEmailForm({ ...emailForm, password: e.target.value })
              }
            />
            {emailError && (
              <p className="text-text-error">{emailError.message}</p>
            )}
            {emailError?.errors &&
              emailError.errors.map((err, index) => (
                <p key={index} className="text-text-error">
                  {err.msg}
                </p>
              ))}
            {emailSuccess && (
              <div className="text-text-success">
                Email updated successfully!
              </div>
            )}
            <Button type="submit" className="w-full" loading={emailLoading}>
              Update Email
            </Button>
          </fieldset>
        </form>
      </section>
    </PageCard>
  );
};
