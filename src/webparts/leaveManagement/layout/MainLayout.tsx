import * as React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./mainLayout.css";

interface IProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: IProps): JSX.Element => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="mainContent">
        <Header />
        <div className="pageContent">{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;
