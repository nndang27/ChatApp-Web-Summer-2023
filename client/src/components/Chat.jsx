import React, { useContext } from "react";
import "../pages/style.css";
import Cam from "../img/video_call.png";

import Messages from "./Messages";
import search from "../img/search.png";
import more from "../img/more_vert.png";
import Input from "./Input";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
const Chat = () => {
  const { data } = useContext(ChatContext);

  const { currentUser } = useContext(AuthContext);
  const roomId = data.chatId;

  const handleSelect = async () => {
    console.log(roomId);
    console.log(currentUser.uid);
    console.log(currentUser.displayName);
    console.log(data.user.uid);
  };

  return (
    <div className="chat">
      <div className="chatInfoBox">
        {data.user.uid && (
          <div class="chatInfo" >
            <div className="receiverInfo">
              <img src={data.user?.photoURL} alt="" />
              <span>{data.user?.displayName}</span>
            </div>
            <div className="chatIcons">
              <img
                className="chatIcon"
                src={Cam}
                alt=""
                onClick={handleSelect}
              />
              <img className="chatIcon" src={search} alt="" />
              <img className="chatIcon" src={more} alt="" />
              {/* <img src="" alt="" /> */}
            </div>
          </div>
        )}
      </div>
      <Messages />
      <Input />
    </div>
  );
};

export default Chat;
