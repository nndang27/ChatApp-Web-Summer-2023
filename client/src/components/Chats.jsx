import { doc, onSnapshot } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { db } from "../firebase";
import { socket } from "../socket";
const Chats = () => {
  // const [receiverInfo, setReceiverInfo] = useState(null);
  const { currentUser } = useContext(AuthContext);
  const { dispatch } = useContext(ChatContext);

  const [chats, setChats] = useState([]);
  const [onlineUser, setOnlineUser] = useState([]);
  socket.on("onlineUsers", (onlineUsers) => {
    // console.log(onlineUsers);
    setOnlineUser(onlineUsers);
    // const onlineUsers = onlineUser.map((user) => user.uid);
  });

  useEffect(() => {
    const getChats = () => {
      const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
        setChats(doc.data());
        // const onlineUsers = onlineUser.map((user) => user.uid);
      });

      return () => {
        unsub();
      };
    };

    currentUser.uid && getChats();
  }, [currentUser.uid]);

  // console.log(onlineUser);
  // console.log(chats);
  const onlineUserUIDs = onlineUser.map((user) => user.uid);
  // console.log(onlineUserUIDs);
  // console.log(onlineUsers);
  // const onlineChats = chats.filter((chat) =>
  //   onlineUserUIDs.includes(chat.userInfo.uid)
  // );
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
              {onlineUser.findIndex((o) => o.userID === chat[1].userInfo.uid) ===
                -1 && <a>offline</a>}
              {onlineUser.findIndex((o) => o.userID === chat[1].userInfo.uid) !==
                -1 && <a>online</a>}

              {chat[1].lastMessage?.text && <p>{chat[1].lastMessage?.text}</p>}

              {!chat[1].lastMessage?.text && <p>Sent a file </p>}
            </div>
          </div>
        ))}
    </div>
  );
};

export default Chats;
