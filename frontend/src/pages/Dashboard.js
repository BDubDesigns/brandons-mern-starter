import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { PageCard } from "../components/PageCard";
export const Dashboard = () => {
    const auth = useAuth();
    const handleLogout = () => {
        auth.logout();
        // Automatically redirected to login by ProtectedRoute
    };
    if (auth.loading) {
        console.log("loading");
        return _jsx("div", { children: "Loading..." });
    }
    if (!auth.user) {
        console.log("This shouldn't be possible.");
        return _jsx("div", { children: "This shouldn't be possible. Please contact support." });
    }
    return (_jsxs(PageCard, { title: "Dashboard", subtitle: `Welcome, ${auth.user.name}`, children: [_jsx("div", { children: _jsxs("p", { className: "mb-2 text-xl", children: ["Your email: ", auth.user.email] }) }), _jsx("div", { children: _jsx(Button, { className: "w-full", onClick: handleLogout, children: "Logout" }) })] }));
};
