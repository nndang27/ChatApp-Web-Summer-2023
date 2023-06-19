import React from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "./style.scss";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import logo from "../img/logo.png";
import facebook from "../img/facebook.png";
import google from "../img/google.png";
import continue_img from "../img/continue.png";
import { socket } from "../socket";

const Login = () => {
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = event.target[0].value;
    const password = event.target[1].value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      socket.connect();
      navigate("/");
    } catch (error) {
      setErr(true);
    }
  };
  return (
    <div className="loginPage">
      <div className="container">
        <div className="welcomeSection">
          <div className="header">
            <img src={logo} alt="" srcset="" />
            <span> DDD Chat</span>
          </div>
          <div className="content">
            <div className="title">WELCOME BACK,</div>
            <div className="subtitle">sign in to continue access app</div>
          </div>
        </div>
        <div className="formWrapper">
          <span className="title">Sign in</span>
          <form action="" className="form" onSubmit={handleSubmit}>
            <input type="email" placeholder="email" />
            <input type="password" placeholder="password" />
            <button className="button">
              Sign Up <img src={continue_img} alt="" srcset="" />
            </button>
            <p>
              Don’t have an account ? <Link to="/register">Register</Link>{" "}
            </p>
            <p>Or sign in with</p>
            <div className="methodLogin">
              <img src={facebook} alt="" srcset="" />
              <img src={google} alt="" srcset="" />
            </div>
          </form>
          {err && <span>Your email or password is incorrect</span>}
        </div>
      </div>
    </div>
  );
};

export default Login;
