import React from "react";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import "./style.scss";
import { socket } from "../socket";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Home = () => {
  // connect to socket when go to the homepage
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) {
    socket.connect();
  }

  socket.on("messageNoti", () => {
    console.log("received!!");
    toast("Wow so easy!");
  });
  return (
    <div className="home">
      <div className="container">
        <ToastContainer />
        <Sidebar />
        <Chat />
      </div>
    </div>
  );
};

export default Home;
