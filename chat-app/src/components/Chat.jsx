import React, { useContext } from "react";
import "../pages/style.css";
import Cam from "../img/video-camera.png";
import More from "../img/more.png";
import Messages from "./Messages";
import Input from "./Input";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
const Chat = () => {
  const { data } = useContext(ChatContext);
  return (
    <div className="chat">
      <div className="chatInfo">
        <span>Dang Dat</span>
        <div className="chatIcons">
          <img className="chatIcon" src={Cam} alt="" />
          <img className="chatIcon" src={More} alt="" />
          {/* <img src="" alt="" /> */}
        </div>
      </div>
      <Messages />
      <Input />
    </div>
  );
};

export default Chat;
