import { Outlet } from "react-router";
import { Header } from "./Header";

export const Layout = () => {
  return (
    // layout with header and outlet for nested routes
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
};
