import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const PageCard = ({ title, subtitle, children }) => {
    return (_jsxs("div", { className: "bg-surface border-border mr-auto mb-2 ml-auto flex max-w-xl flex-col rounded-xl border-2 px-6 py-4", children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("h1", { className: "text-3xl font-bold underline", children: title }), subtitle && _jsx("h3", { className: "my-4 text-xl", children: subtitle })] }), children] }));
};
