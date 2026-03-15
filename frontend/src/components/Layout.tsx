import { Outlet } from "react-router";
import { Header } from "./Header";

export const Layout = () => {
  return (
    // Layout with header and outlet for nested routes
    <div className="text-text bg-background flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 flex-col px-2">
        <Outlet />
      </main>
    </div>
  );
};
