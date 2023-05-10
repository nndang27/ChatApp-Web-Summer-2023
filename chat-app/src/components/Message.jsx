import React from "react";

const Message = () => {
  return (
    <div className="message owner">
      <div className="messageInfo">
        <img
          src="https://heinoldheating.com/wp-content/uploads/2020/07/IAFOR-Blank-Avatar-Image-1-768x768.jpg"
          alt=""
        />
        <span>just now</span>
      </div>
      <div className="messageContent">
        <p>Hello World</p>
      </div>
    </div>
  );
};

export default Message;
