import { createContext, useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { io } from "socket.io-client";

const SocketContext = createContext();

const socket = io("http://192.168.0.52:5000");
// const socket = io("https://web-rtc-backend-pgzk.onrender.com/");
// const socket = io(`${process.env.NODE_ENV === 'production' ? 'https://web-rtc-backend-pgzk.onrender.com/' : 'http://localhost:5000'}`);

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState("");
  const [call, setCall] = useState({});
  const [me, setMe] = useState("");

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef();
  const [remoteStream, setRemoteStream] = useState();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);

        // Only set the video element if the ref is attached. The VideoPlayer
        // component will also set this when it mounts to avoid races.
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      });

    // Debug / diagnostic listeners
    socket.on("connect", () => {
      console.log("[Socket] connected", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] connect_error", err);
    });

    socket.on("me", (id) => {
      console.log("[Socket] me ->", id);
      setMe(id);
    });

    // Accept either `signal` or `signalData` from the server to be more robust
    socket.on("callUser", (payload) => {
      console.log("[Socket] callUser payload ->", payload);
      const { from, name: callerName } = payload || {};
      const signal =
        payload?.signal || payload?.signalData || payload?.signalData;

      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });

    // Clean up listeners on unmount to avoid duplicate handlers in dev (StrictMode)
    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("me");
      socket.off("callUser");
    };
  }, []);

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: call.from });
    });

    peer.on("stream", (currentStream) => {
      // remote video element may not be mounted yet; store as fallback
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      } else {
        setRemoteStream(currentStream);
      }
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name,
      });
    });

    peer.on("stream", (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      } else {
        setRemoteStream(currentStream);
      }
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);

      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    window.location.reload();
  };

  return (
    <SocketContext.Provider
      value={{
        call,
        callAccepted,
        myVideo,
        userVideo,
        remoteStream,
        stream,
        name,
        setName,
        callEnded,
        me,
        callUser,
        leaveCall,
        answerCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
