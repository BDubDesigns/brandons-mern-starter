import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from "@testing-library/react";
import { PageCard } from "../../components/PageCard";
import { describe, it, expect } from "vitest";
describe("PageCard component", () => {
    it("renders title", () => {
        render(_jsx(PageCard, { title: "Test Title", children: "child" }));
        expect(screen.getByRole("heading", { name: "Test Title" })).toBeInTheDocument();
    });
    it("renders subtitle when provided", () => {
        render(_jsx(PageCard, { title: "Test Title", subtitle: "Test Subtitle", children: "child" }));
        expect(screen.getByRole("heading", { name: "Test Subtitle" })).toBeInTheDocument();
    });
    it("does not render subtitle when omitted", () => {
        render(_jsx(PageCard, { title: "Test Title", children: "child" }));
        // There should only be one heading (the title) when subtitle is omitted
        expect(screen.getAllByRole("heading")).toHaveLength(1);
    });
    it("renders children", () => {
        render(_jsx(PageCard, { title: "Test Title", children: "Child Content" }));
        expect(screen.getByText("Child Content")).toBeInTheDocument();
    });
});
