import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export const Profile = () => {
  const auth = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    password: "",
  });
  return <div>Profile</div>;
};
