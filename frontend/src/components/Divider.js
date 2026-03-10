import { jsx as _jsx } from "react/jsx-runtime";
export const Divider = ({ className = "" }) => {
    return (_jsx("hr", { className: `border-border mx-auto w-1/2 rounded-full border-2 ${className}` }));
};
