var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
// In React 19, ref is passed as a regular prop, so we can use it directly
export const FormInput = (_a) => {
    var { type = "text", className = "", // Allow passing additional class names for styling the input element
    containerClassName = "", // Allow passing class names for styling the container div
    label, id, errors } = _a, props = __rest(_a, ["type", "className", "containerClassName", "label", "id", "errors"]);
    const uniqueId = useId(); // Generate a unique ID for accessibility if no id prop is provided
    // We can't call useId conditionally, so we always call it and use id prop anyway, if provided. NEVER CALL HOOKS CONDITIONALLY!
    const inputId = id || uniqueId; // Use provided id or the generated unique ID
    return (_jsxs("div", { className: `flex flex-col gap-0.5 ${containerClassName}`, children: [label && _jsx("label", { htmlFor: inputId, children: label }), _jsx("input", Object.assign({ 
                // Associate label with input for accessibility
                id: inputId, type: type, 
                // Base styles + incoming className override (simple string concat for now)
                className: `bg-surface-input border-border w-full rounded-lg border-2 p-2 ${className}` }, props)), errors && errors.length > 0 && (_jsx("ul", { className: "text-text-error", children: errors.map((errorMsg, index) => (_jsx("li", { children: errorMsg }, index))) }))] }));
};
