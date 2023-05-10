import React from "react";

const Input = () => {
  return (
    <div className="input">
      <input type="text" placeholder="Type Something ..." />
      <div className="send">
        <button className="sendBtn">Send</button>
      </div>
    </div>
  );
};

export default Input;
