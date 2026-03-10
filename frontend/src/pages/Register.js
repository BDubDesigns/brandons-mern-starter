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
    const [validationError, setValidationError] = useState(null);
    // Call useAuth once and save the returned context value to avoid multiple calls and potential performance issues
    const { token, loading, error, register, clearError } = useAuth();
    // UseNavigate hook from react-router to programmatically navigate after successful registration
    const navigate = useNavigate();
    // UseEffect to redirect to dashboard after successful registration (when token changes from null to a valid token)
    useEffect(() => {
        if (token && !loading) {
            navigate("/dashboard");
        }
    }, [token, loading, navigate]); // We include navigate in the dependency array to avoid potential issues with stale closures, even though navigate is stable from useNavigate
    // useEffect to clear errors on mount
    useEffect(() => {
        clearError();
    }, [clearError]);
    // Handle form submission for registration
    const handleRegister = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault(); // Prevent the default form submission behavior which would cause a page reload
        setValidationError(null);
        // Check that password and confirmPassword match before calling register
        if (password !== confirmPassword) {
            setValidationError("Passwords do not match");
            return;
        }
        console.log("registering");
        yield register(name, email, password); // Call the register function from AuthContext with the form inputs
    });
    // If loading, show a loading indicator
    if (loading) {
        console.log("loading");
        return _jsx("div", { children: "Loading..." });
    }
    // So that we don't show the registration form if the user is already logged in, we check
    //  if token exists and show a redirecting message. useEffect above will handle the actual redirect.
    if (token) {
        console.log("redirecting");
        return _jsx("div", { children: "Redirecting..." });
    }
    return (_jsxs(PageCard, { title: "Register Page", subtitle: "Create a new account.", children: [validationError && (_jsx("p", { className: "text-text-error font-bold", children: validationError })), _jsx("form", { onSubmit: handleRegister, children: _jsxs("fieldset", { children: [_jsx("legend", { className: "pb-4 text-2xl font-semibold", children: "Enter your details" }), _jsx(FormInput, { type: "text", label: "Name", errors: getFieldErrors("name", error === null || error === void 0 ? void 0 : error.errors), value: name, onChange: (e) => setName(e.target.value), required: true }), _jsx(FormInput, { type: "email", label: "Email", errors: getFieldErrors("email", error === null || error === void 0 ? void 0 : error.errors), value: email, onChange: (e) => setEmail(e.target.value), required: true }), _jsx(FormInput, { type: "password", label: "Password", errors: getFieldErrors("password", error === null || error === void 0 ? void 0 : error.errors), value: password, onChange: (e) => setPassword(e.target.value), required: true }), _jsx(FormInput, { type: "password", label: "Confirm Password", errors: getFieldErrors("confirmPassword", error === null || error === void 0 ? void 0 : error.errors), value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), required: true }), error && !error.errors && (_jsx("p", { className: "text-text-error font-bold", children: error.message })), _jsx("div", { className: "flex justify-center pt-2 pb-4", children: _jsx(Button, { type: "submit", className: "w-full", loading: loading, children: "Register" }) })] }) })] }));
};
