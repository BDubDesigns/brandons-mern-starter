var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { PageCard } from "../components/PageCard";
import { FormInput } from "../components/FormInput";
import { Button } from "../components/Button";
import { Divider } from "../components/Divider";
import { getFieldErrors } from "../utils/getFieldErrors";
export const Profile = () => {
    var _a, _b;
    const auth = useAuth();
    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });
    const [passwordError, setPasswordError] = useState(null);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    // Email form state
    const [emailForm, setEmailForm] = useState({
        newEmail: "",
        password: "",
    });
    const [emailError, setEmailError] = useState(null);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState(false);
    // Password form handler
    const handlePasswordChange = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault(); // Prevent default form submission behavior
        setPasswordError(null); // Clear previous errors
        setPasswordSuccess(false); // Reset success state
        // frontend validation: confirm passwords match here before calling backend
        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            setPasswordError({ message: "New passwords do not match" });
            return;
        }
        setPasswordLoading(true);
        try {
            yield auth.updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
            // Success - reset form and show success message
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmNewPassword: "",
            });
            setPasswordSuccess(true);
        }
        catch (error) {
            setPasswordError(error); // We use as to cast the error to FormError type, because we know the backend sends errors in that format
        }
        finally {
            setPasswordLoading(false);
        }
    });
    // Email form handler
    const handleEmailChange = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault(); // Prevent default form submission behavior
        setEmailError(null); // Clear previous errors
        setEmailSuccess(false); // Reset success state
        setEmailLoading(true);
        try {
            yield auth.updateEmail(emailForm.newEmail, emailForm.password);
            // Success - reset form and show success message
            setEmailForm({
                newEmail: "",
                password: "",
            });
            setEmailSuccess(true);
        }
        catch (error) {
            setEmailError(error);
        }
        finally {
            setEmailLoading(false);
        }
    });
    return (_jsxs(PageCard, { title: "Profile Page", subtitle: `${(_a = auth.user) === null || _a === void 0 ? void 0 : _a.name}'s Profile`, children: [_jsx("section", { children: _jsx("form", { onSubmit: handlePasswordChange, children: _jsxs("fieldset", { children: [_jsx("legend", { className: "mb-2 text-xl font-semibold", children: "Change Password" }), _jsx(FormInput, { type: "password", label: "Current Password", errors: getFieldErrors("currentPassword", passwordError === null || passwordError === void 0 ? void 0 : passwordError.errors), containerClassName: "mb-2", value: passwordForm.currentPassword, onChange: (e) => setPasswordForm(Object.assign(Object.assign({}, passwordForm), { currentPassword: e.target.value })) }), _jsx(FormInput, { type: "password", label: "New Password", errors: getFieldErrors("newPassword", passwordError === null || passwordError === void 0 ? void 0 : passwordError.errors), containerClassName: "mb-2", value: passwordForm.newPassword, onChange: (e) => setPasswordForm(Object.assign(Object.assign({}, passwordForm), { newPassword: e.target.value })) }), _jsx(FormInput, { type: "password", label: "Confirm New Password", containerClassName: "mb-2", value: passwordForm.confirmNewPassword, onChange: (e) => setPasswordForm(Object.assign(Object.assign({}, passwordForm), { confirmNewPassword: e.target.value })) }), passwordError &&
                                !passwordError.errors && ( // Only show the generic error message when no field-specific errors
                            _jsx("div", { className: "text-text-error", children: passwordError.message })), passwordSuccess && (_jsx("div", { className: "text-text-success", children: "Password updated successfully!" })), _jsx(Button, { className: "mt-2 w-full", type: "submit", loading: passwordLoading, children: "Update Password" })] }) }) }), _jsx(Divider, { className: "mt-6" }), _jsx("section", { className: "mt-6", children: _jsx("form", { onSubmit: handleEmailChange, children: _jsxs("fieldset", { children: [_jsx("legend", { className: "mb-2 text-xl font-semibold", children: "Change Email" }), _jsxs("p", { className: "mb-2 text-base font-bold", children: ["Current Email: ", (_b = auth.user) === null || _b === void 0 ? void 0 : _b.email] }), _jsx(FormInput, { type: "email", label: "New Email", containerClassName: "mb-2", errors: getFieldErrors("newEmail", emailError === null || emailError === void 0 ? void 0 : emailError.errors), value: emailForm.newEmail, onChange: (e) => setEmailForm(Object.assign(Object.assign({}, emailForm), { newEmail: e.target.value })) }), _jsx(FormInput, { type: "password", label: "Password", containerClassName: "mb-2", errors: getFieldErrors("password", emailError === null || emailError === void 0 ? void 0 : emailError.errors), value: emailForm.password, onChange: (e) => setEmailForm(Object.assign(Object.assign({}, emailForm), { password: e.target.value })) }), emailError &&
                                !emailError.errors && ( // Only show the generic error message when no field-specific errors
                            _jsx("div", { className: "text-text-error", children: emailError.message })), emailSuccess && (_jsx("div", { className: "text-text-success", children: "Email updated successfully!" })), _jsx(Button, { type: "submit", className: "mt-2 w-full", loading: emailLoading, children: "Update Email" })] }) }) })] }));
};
