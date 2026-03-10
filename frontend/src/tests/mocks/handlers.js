import { http, HttpResponse } from "msw";
export const handlers = [
    http.post("http://localhost:5000/api/auth/login", () => {
        return HttpResponse.json({
            token: "fake-token",
            user: { _id: "123", name: "Test User", email: "test@example.com" },
        }, { status: 200 });
    }),
    http.post("http://localhost:5000/api/auth/register", () => {
        return HttpResponse.json({
            token: "fake-token",
            user: { _id: "123", name: "Test User", email: "test@example.com" },
        }, { status: 200 });
    }),
    http.get("http://localhost:5000/api/auth/me", () => {
        return HttpResponse.json({ user: { _id: "123", name: "Test User", email: "test@example.com" } }, { status: 200 });
    }),
    http.patch("http://localhost:5000/api/auth/update-password", () => {
        return HttpResponse.json({ message: "Password updated successfully" }, { status: 200 });
    }),
    http.patch("http://localhost:5000/api/auth/update-email", () => {
        return HttpResponse.json({
            token: "new-fake-token",
            user: { _id: "123", name: "Test User", email: "new@example.com" },
        }, { status: 200 });
    }),
];
