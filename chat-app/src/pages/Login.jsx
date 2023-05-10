import React from "react";
import "./style.css";
const Login = () => {
  return (
    <div className="formContainer">
      <div className="formWrapper">
        <span className="logo">DDD Chat</span>
        <span className="title">Login</span>
        <form action="" className="form">
          <input type="email" placeholder="email" />
          <input type="password" placeholder="password" />
          <button className="button">Sign In</button>
          <p>You have already had an account? Register </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
