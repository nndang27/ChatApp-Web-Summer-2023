import React, { useContext } from "react";
import "../pages/style.css";
import Cam from "../img/video_call.png";
import online from "../img/available.png";
import offline from "../img/unavailable.png";
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
    const roomID = data.chatId
    const host = currentUser.displayName
    const client_name = data.user.displayName
    // socket.emit("send_username",host)

    const redirectURL = `http://127.0.0.1:4000/sfu/${roomID}/${host}`;
    window.open(`${redirectURL}`, '_blank','width=800,height=600');
  };

  return (
    <div className="chat">
      <div className="chatInfoBox">
        {data.user.uid && (
          <div class="chatInfo">
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
