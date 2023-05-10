import React, { useState } from "react";
import "./style.css";
import icon from "../img/icon.png";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const Register = () => {
  const [err, setErr] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    const displayName = event.target[0].value;
    const email = event.target[1].value;
    const password = event.target[2].value;
    const file = event.target[3].files[0];

    try {
      const auth = getAuth();
      const res = await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setErr(true);
    }
  };
  return (
    <div className="formContainer">
      <div className="formWrapper">
        <span className="logo">DDD Chat</span>
        <span className="title">Register</span>
        <form action="" className="form" onSubmit={handleSubmit}>
          <input type="text" placeholder="display name" />
          <input type="email" placeholder="email" />
          <input type="password" placeholder="password" />
          <input type="file" style={{ display: "none" }} id="file" />
          <label htmlFor="file">
            <img src={icon} alt="" /> <span>Upload your avatar here</span>
          </label>
          <button className="button">Sign Up</button>
          <p>You have already had an account? Log in </p>
          {err && <span>Something went wrong</span>}
        </form>
      </div>
    </div>
  );
};

export default Register;
