import React, { useState, useRef } from "react";
import "./style.scss";
import icon from "../img/icon.png";
import upload_file from "../img/upload_file.png";
import continue_img from "../img/continue.png";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { storage } from "../firebase";
import { db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import logo from "../img/logo.png";

const Register = () => {
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState();

  function handleChange(e) {
    console.log(e.target.files);
    const file = e.target.files[0];
    file.preview = URL.createObjectURL(file);
    setAvatar(file);
  }

  function confirmPwd() {
    var password = document.querySelector('input[type="password"]').value;
    var confirmPassword = document.querySelector(
      'input[placeholder="confirm your password"]'
    ).value;

    if (password === confirmPassword) {
      console.log("Passwords match!");
      return true;
      // Perform any additional actions or validations if needed
    } else {
      console.log("Passwords do not match!");
      return false;
    }
  }
  const handleSubmit = async (event) => {
    event.preventDefault();
    const displayName = event.target[0].value;
    const email = event.target[1].value;
    const password = event.target[2].value;
    const file = event.target[4].files[0];
    console.log(file);
    // if (file == null) {
    // }
    if (confirmPwd()) {
      try {
        //Create user
        const auth = getAuth();
        const res = await createUserWithEmailAndPassword(auth, email, password);

        //Create a unique image name
        const date = new Date().getTime();
        const storageRef = ref(storage, `${displayName + date}`);

        await uploadBytesResumable(storageRef, file).then(() => {
          getDownloadURL(storageRef).then(async (downloadURL) => {
            try {
              //Update profile
              await updateProfile(res.user, {
                displayName,
                photoURL: downloadURL,
              });
              //create user on firestore
              await setDoc(doc(db, "users", res.user.uid), {
                uid: res.user.uid,
                displayName,
                email,
                photoURL: downloadURL,
              });

              //create empty user chats on firestore
              await setDoc(doc(db, "userChats", res.user.uid), {});
              navigate("/");
            } catch (err) {
              console.log(err);
              setErr(true);
              setLoading(false);
            }
          });
        });
      } catch (err) {
        setErr(true);
        setLoading(false);
      }
    } else {
      alert("pwd does not match");
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
            <div className="title">Hãy chat theo cách của bạn</div>
            {/* <div className="subtitle">sign in to continue access app</div> */}
          </div>
        </div>
        <div className="formWrapper">
          <span className="title">Register</span>
          <form action="" className="form" onSubmit={handleSubmit}>
            <input type="text" placeholder="display name" required />
            <input type="email" placeholder="email" required />
            <input type="password" placeholder="password" required />
            <input
              type="password"
              placeholder="confirm your password"
              onKeyUp={confirmPwd}
            />
            <input
              type="file"
              style={{ display: "none" }}
              onChange={handleChange}
              id="file"
            />
            <label htmlFor="file">
              {avatar && <img src={avatar.preview} alt="" />}
              <span>Upload your avatar here</span>
            </label>
            <button className="button">
              Sign Up <img src={continue_img} alt="" srcset="" />
            </button>
            <p>
              You have already had an account? <Link to="/login">Log in</Link>{" "}
            </p>
            {err && <span>Something went wrong</span>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
