import React from "react";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import "./style.scss";
import { socket } from "../socket";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
const Home = () => {
  // connect to socket when go to the homepage
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) {
    socket.connect();
  }
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
