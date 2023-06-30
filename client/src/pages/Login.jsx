import React from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import "./style.scss";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import logo from "../img/logo.png";
import github from "../img/github.png";
import google from "../img/google.png";
import continue_img from "../img/continue.png";
import { socket } from "../socket";
import { doc, setDoc } from "firebase/firestore";
import { storage } from "../firebase";
import { ref, uploadBytesResumable } from "firebase/storage";
import { getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { signInWithPopup, GithubAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

const Login = () => {
  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    signInWithPopup(auth, provider)
      .then(async (result) => {
        console.log(result.user.email);
        // Đăng nhập thành công
        const user = result.user;
        console.log(user);

        const email = user.email;
        const usersCollectionRef = collection(db, "users");
        const queryByEmail = query(usersCollectionRef, where("email", "==", email));

        try {
          const querySnapshot = await getDocs(queryByEmail);
          if (!querySnapshot.empty) {
            // Email exist => sign in and navigate
            signInWithEmailAndPassword(auth, user.email, user.password);
            socket.connect();
            navigate("/");
          } else {
            // Email not exist, create account in db and navigate
            const date = new Date().getTime();
            const displayName = user.displayName;
            const photoLink = user.photoURL;
            const storageRef = ref(storage, `${displayName + date}`);
            
            await uploadBytesResumable(storageRef, photoLink).then(() => {
              getDownloadURL(storageRef).then(async (downloadURL) => {
                try {
                  //Update profile
                  await updateProfile(result.user, {
                    displayName,
                    photoURL: downloadURL,
                  });
                  console.log("123");
                  //create user on firestore
                  await setDoc(doc(db, "users", result.user.uid), {
                    uid: result.user.uid,
                    displayName,
                    email,
                    photoURL: downloadURL,
                  });
    
                  //create empty user chats on firestore
                  await setDoc(doc(db, "userChats", result.user.uid), {});
                  navigate("/");
                } catch (err) {
                  console.log(err);
                  setErr(true);
                  setLoading(false);
                }
              });
            });
          }
        } catch (error) {
            console.log("Error when check email or create account: ", error);
        }
      })
      .catch((error) => {
        console.log("Error when sign in with github: ", error);
      });
  };
  
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(async (result) => {
        // Đăng nhập thành công
        const user = result.user;
        console.log(user);

        const email = user.email;
        const usersCollectionRef = collection(db, "users");
        const queryByEmail = query(usersCollectionRef, where("email", "==", email));

        try {
          const querySnapshot = await getDocs(queryByEmail);
          if (!querySnapshot.empty) {
            // Email exist => sign in and navigate
            signInWithEmailAndPassword(auth, user.email, user.password);
            socket.connect();
            navigate("/");
          } else {
            // Email not exist, create account in db and navigate
            const date = new Date().getTime();
            const displayName = user.displayName;
            const photoLink = user.photoURL;
            const storageRef = ref(storage, `${displayName + date}`);
            
            await uploadBytesResumable(storageRef, photoLink).then(() => {
              getDownloadURL(storageRef).then(async (downloadURL) => {
                try {
                  //Update profile
                  await updateProfile(result.user, {
                    displayName,
                    photoURL: downloadURL,
                  });
                  console.log("123");
                  //create user on firestore
                  await setDoc(doc(db, "users", result.user.uid), {
                    uid: result.user.uid,
                    displayName,
                    email,
                    photoURL: downloadURL,
                  });
    
                  //create empty user chats on firestore
                  await setDoc(doc(db, "userChats", result.user.uid), {});
                  navigate("/");
                } catch (err) {
                  console.log(err);
                  setErr(true);
                  setLoading(false);
                }
              });
            });
          }
        } catch (error) {
            console.log("Error when check email or create account: ", error);
        }
      })
      .catch((error) => {
        console.log("Error when sign in with google: ", error);
      });
  };

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
              <button className="logingh" onClick={signInWithGithub}>
                <img src={github} alt="" srcset="" />
              </button>
              <button className="logingg" onClick={signInWithGoogle}>
                <img src={google} alt="" srcset="" />
              </button>
            </div>
          </form>
          {err && <span>Your email or password is incorrect</span>}
        </div>
      </div>
    </div>
  );
};

export default Login;
