import { Outlet } from "react-router";
import { Header } from "./Header";

export const Layout = () => {
  return (
    // layout with header and outlet for nested routes
    <div className="text-text bg-background flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-2">
        <Outlet />
      </main>
    </div>
  );
};
