import { createContext, useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { io } from "socket.io-client";

const SocketContext = createContext();

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

  // add a ref to hold socket so all handlers can access the same instance
  const socketRef = useRef(null);

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

    // Initialize socket here so we can control connect timing and debug.
    // Change the URL to match your server if needed.
    const url = "http://localhost:5000";
    const s = io(url, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      timeout: 20000,
    });
    socketRef.current = s;

    // Expose for quick manual debugging in browser console
    // e.g. window.__socket?.connected, window.__socket?.id, window.__socket?.disconnect()
    window.__socket = s;

    // Attach diagnostic listeners
    s.on("connect", () => {
      console.log("[Socket] connected", s.id);
    });
    s.on("disconnect", (reason) => {
      console.log("[Socket] disconnected:", reason);
    });
    s.on("connect_error", (err) => {
      console.warn("[Socket] connect_error", err);
    });
    s.on("reconnect_attempt", (attempt) => {
      console.log("[Socket] reconnect_attempt", attempt);
    });
    s.on("reconnect_error", (err) => {
      console.warn("[Socket] reconnect_error", err);
    });
    s.on("connect_timeout", (timeout) => {
      console.warn("[Socket] connect_timeout", timeout);
    });

    s.on("me", (id) => {
      console.log("[Socket] me ->", id);
      setMe(id);
    });

    s.on("callUser", (payload) => {
      console.log("[Socket] callUser payload ->", payload);
      const { from, name: callerName } = payload || {};
      const signal =
        payload?.signal || payload?.signalData || payload?.signalData;
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });

    // Now explicitly connect and log result
    try {
      s.connect();
      console.log("[Socket] connecting to", url);
    } catch (err) {
      console.error("[Socket] connect throw", err);
    }

    // Clean up listeners on unmount and disconnect
    return () => {
      try {
        s.off();
        s.disconnect();
      } catch (e) {
        // ignore
      }
      window.__socket = null;
    };
  }, []);

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (data) => {
      socketRef.current?.emit("answerCall", { signal: data, to: call.from });
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
      socketRef.current?.emit("callUser", {
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

    // Use a namespaced listener on the ref so we can remove/avoid duplicates.
    const s = socketRef.current;
    const callAcceptedHandler = (signal) => {
      setCallAccepted(true);

      peer.signal(signal);
    };

    s?.on("callAccepted", callAcceptedHandler);

    connectionRef.current = peer;
    // Ensure we remove this specific handler if the call ends/destroys
    peer.on("close", () => {
      s?.off("callAccepted", callAcceptedHandler);
    });
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
