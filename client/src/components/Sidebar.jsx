import React from "react";
import Navbar from "./Navbar";
import "../pages/style.css";
import Search from "./Search";
import Chats from "./Chats";
import Setting from "./Setting";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <Navbar />
      <Search />
      <Chats />
      <Setting />
    </div>
  );
};

export default Sidebar;
