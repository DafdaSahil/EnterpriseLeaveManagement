import * as React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./mainLayout.css";

interface IProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: IProps): JSX.Element => {
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(false);

  const toggleSidebar = (): void => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = (): void => {
    setSidebarOpen(false);
  };

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="mainContent">
        <Header onMenuToggle={toggleSidebar} />
        <div className="pageContent">{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;
