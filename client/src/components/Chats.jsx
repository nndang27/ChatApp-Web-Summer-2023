import { doc, onSnapshot } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { db } from "../firebase";
import { socket } from "../socket";
const Chats = () => {
  const [chats, setChats] = useState([]);
  const [receiverInfo, setReceiverInfo] = useState(null);

  const { currentUser } = useContext(AuthContext);
  const { dispatch } = useContext(ChatContext);
  // socket.on("onlineUsers", (onlineUsers) => {
  //   onlineUsers.forEach((user) => {
  //     let obj = chats.find((x) => x.userInfo.uid == user.userID);
  //     if (obj !== -1) {
  //       x.userInfo.status = "online";
  //     }
  //   });
  // });

  useEffect(() => {
    const getChats = () => {
      const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
        setChats(doc.data());
      });

      return () => {
        unsub();
      };
    };

    currentUser.uid && getChats();
  }, [currentUser.uid]);

  const handleSelect = (u) => {
    dispatch({ type: "CHANGE_USER", payload: u });
  };

  return (
    <div className="chats">
      {Object.entries(chats)
        ?.sort((a, b) => b[1].date - a[1].date)
        .map((chat) => (
          <div
            className="userChat"
            key={chat[0]}
            onClick={() => handleSelect(chat[1].userInfo)}
          >
            <img src={chat[1].userInfo.photoURL} alt="" />
            <div className="userChatInfo">
              <span>{chat[1].userInfo.displayName}</span>
              {chat[1].lastMessage?.text && <p>{chat[1].lastMessage?.text}</p>}
              {!chat[1].lastMessage?.text && <p>Sent a file </p>}
            </div>
          </div>
        ))}
    </div>
  );
};

export default Chats;
