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

  return <div>Profile</div>;
};
