import "./App.css";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { useRef } from "react";
import { AuthContext } from "./context/AuthContext";
import React, { useState, useEffect } from "react";
import { socket } from "./socket";
import { ConnectionState } from "./components/ConnectionState";
import { ConnectionManager } from "./components/ConnectionManager";

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [fooEvents, setFooEvents] = useState([]);
  const { currentUser } = useContext(AuthContext);
  // console.log({ currentUser });

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    // function onFooEvent(value) {
    //   setFooEvents((previous) => [...previous, value]);
    // }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    // socket.on("foo", onFooEvent);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      // socket.off("foo", onFooEvent);
    };
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }
    // socket.connect();
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route
            index
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
