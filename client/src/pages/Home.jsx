import React from "react";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import "./style.scss";
import { socket } from "../socket";
const Home = () => {
  socket.connect();// connect to socket when go to the homepage
  return (
    <div className="home">
      <div className="container">
        <Sidebar />

        <Chat />
      </div>
    </div>
  );
};

export default Home;
