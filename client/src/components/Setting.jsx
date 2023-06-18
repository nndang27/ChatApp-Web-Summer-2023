import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import setting from "../img/settings.png";
import logout from "../img/logout.png";
import { socket } from "../socket";
const Setting = () => {
  return (
    <div className="setting">
      <img src={setting} alt="" srcset="" className="settingIcon" />
      <button
        onClick={() => {
          signOut(auth);
          socket.disconnect();
        }}
      >
        <img src={logout} alt="" srcset="" />
        Logout
      </button>
    </div>
  );
};

export default Setting;
