import React from "react";
import avatar from "../img/avatar.jpg";
const Navbar = () => {
  return (
    <div className="navbar">
      <span className="logo1">DDD chat</span>
      <div className="user">
        <img
          className="avatar-img"
          src="https://heinoldheating.com/wp-content/uploads/2020/07/IAFOR-Blank-Avatar-Image-1-768x768.jpg"
          alt=""
        />
        <span>Dat Dang</span>
        <button className="logout"> Logout </button>
      </div>
    </div>
  );
};

export default Navbar;
