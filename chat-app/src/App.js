import "./App.css";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAZor8ettIPU-rAgyjl5OwSwi3mWPy-kzE",
  authDomain: "fir-learning-25dbc.firebaseapp.com",
  projectId: "fir-learning-25dbc",
  storageBucket: "fir-learning-25dbc.appspot.com",
  messagingSenderId: "624789124397",
  appId: "1:624789124397:web:e4d1f30f175ef050430fa4",
  measurementId: "G-B8Q6JED3ZW",
};

const app = firebase.initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = firebase.auth();
const firestore = firebase.firestore();

const [user] = userAuthState(auth);

function App() {
  const [data, setData] = useState({});
  const handleInput = (event)=>{
    // let newInput = {event.target.name}
  }

  return (
    <div className="App">
      <header className="App-header"></header>
      <section>

      </section>
    </div>
  );
}

export default App;
