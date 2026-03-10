var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../../components/Button";
import { describe, it, expect, vi } from "vitest";
describe("Button", () => {
    it("renders children as button text", () => {
        render(_jsx(Button, { children: "Click me" }));
        expect(screen.getByRole("button")).toHaveTextContent("Click me");
    });
    it("calls onClick when clicked", () => __awaiter(void 0, void 0, void 0, function* () {
        const handleClick = vi.fn();
        render(_jsx(Button, { onClick: handleClick, children: "Click me" }));
        const user = userEvent.setup();
        // UserEvent simulates the full browser event chain (mousedown → focus → click), unlike .click()
        yield user.click(screen.getByRole("button"));
        expect(handleClick).toHaveBeenCalled();
    }));
    describe("when loading prop is true", () => {
        it("shows 'Loading...' text", () => {
            render(_jsx(Button, { loading: true, children: "Click me" }));
            expect(screen.getByRole("button")).toHaveTextContent("Loading...");
        });
        it("is disabled when loading is true", () => {
            render(_jsx(Button, { loading: true, children: "Click me" }));
            expect(screen.getByRole("button")).toBeDisabled();
        });
    });
});
