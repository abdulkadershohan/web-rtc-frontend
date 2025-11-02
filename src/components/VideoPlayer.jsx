import { Paper, Typography ,Stack} from "@mui/material";
import { useContext, useEffect } from "react";
import { SocketContext } from "../Context";

const VideoPlayer = () => {
  const {
    name,
    callAccepted,
    myVideo,
    userVideo,
    callEnded,
    stream,
    call,
    remoteStream,
  } = useContext(SocketContext);

  // Assign local stream to the video element when available and the ref exists
  useEffect(() => {
    if (myVideo?.current && stream) {
      myVideo.current.srcObject = stream;
    }
  }, [stream, myVideo]);

  // If a remote stream was provided before the remote <video> ref attached,
  // assign it when either becomes available.
  useEffect(() => {
    if (userVideo?.current && remoteStream) {
      userVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream, userVideo]);

  return (
    <Stack direction="row" spacing={2} justifyContent="center">
      {stream && (
        <Paper className="video-paper">
          <div className="video-card">
            <Typography variant="h6" gutterBottom>
              {name || "Me"}
            </Typography>
            <video
              className="video-element"
              playsInline
              muted
              ref={myVideo}
              autoPlay
            />
          </div>
        </Paper>
      )}

      {callAccepted && !callEnded && (
        <Paper className="video-paper">
          <div className="video-card">
            <Typography variant="h6" gutterBottom>
              {call.name || "Caller"}
            </Typography>
            <video
              className="video-element"
              playsInline
              ref={userVideo}
              autoPlay
            />
          </div>
        </Paper>
      )}
    </Stack>
  );
};

export default VideoPlayer;
