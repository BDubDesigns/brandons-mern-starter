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
import { Button } from "../components/Button";
import { FormInput } from "../components/FormInput";
import { PageCard } from "../components/PageCard";
import { getFieldErrors } from "../utils/getFieldErrors";
export const Login = () => {
    // Local state for form inputs
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // Call useAuth once and save the returned context value to avoid multiple calls and potential performance issues
    const { token, loading, error, login, clearError } = useAuth();
    // UseNavigate hook from react-router to programmatically navigate after successful login
    const navigate = useNavigate();
    // UseEffect to redirect to dashboard after successful login (when token changes from null to a valid token)
    // We check for token instead of user because the token is what actually indicates whether the user is authenticated, and it will be set immediately upon successful login, while the user data may take a moment to fetch and update in the context
    useEffect(() => {
        if (token && !loading) {
            navigate("/dashboard");
        }
    }, [token, loading, navigate]); // We include navigate in the dependency array to avoid potential issues with stale closures, even though navigate is stable from useNavigate
    // useEffect to clear errors on mount
    useEffect(() => {
        clearError();
    }, [clearError]); // We include clearError in the dependency array to avoid potential issues with stale closures, even though clearError is stable from useCallback
    const handleLogin = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault(); // Prevent the default form submission behavior which would cause a page reload
        yield login(email, password); // Call the login function from AuthContext with the email and password from the form inputs
    });
    // Show loading while checking if user is already logged in
    if (loading) {
        console.log("loading");
        return _jsx("div", { children: "Loading..." });
    }
    // If user is already logged in, show redirect message
    if (token) {
        console.log("redirecting");
        return _jsx("div", { children: "Redirecting..." });
    }
    return (_jsx(PageCard, { title: "Login Page", subtitle: "Enter your credentials to log in.", children: _jsx("form", { onSubmit: handleLogin, children: _jsxs("fieldset", { children: [_jsx("legend", { className: "mb-4 text-2xl font-semibold", children: "Enter your credentials" }), _jsx(FormInput, { type: "email", name: "email", label: "Email", containerClassName: "mb-2", errors: getFieldErrors("email", error === null || error === void 0 ? void 0 : error.errors), required: true, value: email, onChange: (e) => setEmail(e.target.value) }), _jsx(FormInput, { type: "password", name: "password", label: "Password", containerClassName: "mb-2", errors: getFieldErrors("password", error === null || error === void 0 ? void 0 : error.errors), required: true, value: password, onChange: (e) => setPassword(e.target.value) }), error && _jsx("p", { className: "text-text-error", children: error.message }), (error === null || error === void 0 ? void 0 : error.errors) &&
                        error.errors.map((err, index) => (_jsx("p", { className: "text-text-error", children: err.msg }, index))), _jsx("div", { className: "mt-2 flex justify-center pb-2", children: _jsx(Button, { className: "w-full", type: "submit", loading: loading, children: "Login" }) })] }) }) }));
};
