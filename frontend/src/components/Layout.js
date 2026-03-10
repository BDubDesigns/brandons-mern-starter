import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from "react-router";
import { Header } from "./Header";
export const Layout = () => {
    return (
    // Layout with header and outlet for nested routes
    _jsxs("div", { className: "text-text bg-background flex min-h-dvh flex-col", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 px-2", children: _jsx(Outlet, {}) })] }));
};
