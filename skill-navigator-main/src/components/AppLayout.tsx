import { Outlet } from "react-router-dom";
import AppNavbar from "./AppNavbar";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
