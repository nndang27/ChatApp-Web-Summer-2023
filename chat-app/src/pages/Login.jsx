import React from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "./style.css";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

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
      navigate("/");
    } catch (error) {
      setErr(true);
    }
  };
  return (
    <div className="formContainer">
      <div className="formWrapper">
        <span className="logo">DDD Chat</span>
        <span className="title">Login</span>
        <form action="" className="form" onSubmit={handleSubmit}>
          <input type="email" placeholder="email" />
          <input type="password" placeholder="password" />
          <button className="button">Sign In</button>
          <p>
            You have already had an account?{" "}
            <Link to="/register">Register</Link>{" "}
          </p>
        </form>
        {err && <span>Something went wrong</span>}
      </div>
    </div>
  );
};

export default Login;
