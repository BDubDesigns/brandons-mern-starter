import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";
import { Link } from "react-router";
// Import icons
import { MdBrightness7, MdBrightness4, MdBrightnessAuto } from "react-icons/md";
import { GiHamburgerMenu } from "react-icons/gi";
// Helper function to get icon for theme choice
const getThemeIcon = (choice) => {
    if (choice === "light")
        return _jsx(MdBrightness7, { size: "24" });
    if (choice === "dark")
        return _jsx(MdBrightness4, { size: "24" });
    return _jsx(MdBrightnessAuto, { size: "24" }); // Null means "os"
};
export const Header = () => {
    // Get auth and theme context
    const { user, logout } = useAuth();
    const { choice, cycleTheme } = useTheme();
    // Hambuger menu state (for mobile)
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // Define the visual style for interactive elements (Buttons/Links)
    // Moved 'flex h-full items-center' here ensures the content centers within the button
    const interactiveClass = "flex h-full w-full items-center p-2 m-2 rounded-lg border-2 border-border bg-interactive hover:bg-interactive-hover text-text cursor-pointer";
    // Theme button element
    const themeButton = (_jsx("button", { className: interactiveClass, "aria-label": "Cycle theme", onClick: cycleTheme, children: getThemeIcon(choice) }));
    // Conditionally generate a list of nav items based on auth state
    const navItems = user
        ? [
            { label: user.name, type: "span" },
            { label: "Profile", type: "link", to: "/profile" },
            { label: "Logout", type: "button", onClick: logout },
        ]
        : [
            { label: "Login", type: "link", to: "/login" },
            { label: "Register", type: "link", to: "/register" },
        ];
    return (_jsxs("header", { className: "bg-surface text-text border-border sticky top-0 z-50 mb-2 border-b-2 font-semibold", children: [_jsx("nav", { className: "hidden h-14 items-center md:flex", children: _jsxs("ul", { className: "flex w-full items-center", children: [_jsx("li", { className: "ml-2 text-3xl font-bold", children: _jsx(Link, { to: "/", children: "MernStarter" }) }), navItems.map((item, index) => (_jsxs("li", { className: `flex items-center ${index === 0 ? "ml-auto" : ""}`, children: [item.type === "link" && item.to && (_jsx(Link, { className: interactiveClass, to: item.to, children: item.label })), item.type === "button" && item.onClick && (_jsx("button", { className: interactiveClass, onClick: item.onClick, children: item.label })), item.type === "span" && (_jsx("span", { className: "m-2 p-2", children: item.label }))] }, index))), _jsx("li", { className: "flex items-center", children: themeButton })] }) }), _jsxs("nav", { className: "md:hidden", children: [_jsxs("div", { className: "bg-surface text-text border-border flex items-center border-b font-semibold", children: [_jsx("span", { className: "mr-auto flex pl-2 text-3xl font-bold", children: _jsx(Link, { to: "/", children: "MS" }) }), _jsx("span", { className: "flex items-center", children: themeButton }), _jsx("span", { className: "border-border bg-interactive hover:bg-interactive-hover m-2 rounded-lg border-2 p-2", onClick: () => setIsMenuOpen(!isMenuOpen), children: _jsx(GiHamburgerMenu, { size: "24" }) })] }), _jsx("ul", { children: isMenuOpen && (_jsx(_Fragment, { children: navItems.map((item, index) => item.type !== "span" && (_jsxs("li", { className: "border-border flex h-11 items-center border-b pl-2", children: [item.type === "link" && item.to && (_jsx(Link, { className: "flex h-full w-full items-center", to: item.to, onClick: () => setIsMenuOpen(false), children: item.label })), item.type === "button" && item.onClick && (_jsx("button", { className: "flex h-full w-full cursor-pointer items-center text-left", onClick: () => {
                                            item.onClick();
                                            setIsMenuOpen(false);
                                        }, children: item.label }))] }, index))) })) })] })] }));
};
