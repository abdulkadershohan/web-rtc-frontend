import { Assignment, Phone, PhoneDisabled } from "@mui/icons-material";
import {
  Button,
  Container,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";

import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { SocketContext } from "../Context";

const Sidebar = ({ children }) => {
  const { me, callAccepted, name, setName, callEnded, leaveCall, callUser } =
    useContext(SocketContext);
  const [idToCall, setIdToCall] = useState("");

  return (
    <Container className="sidebar-container">
      <Paper elevation={10} className="sidebar-paper">
        <form noValidate autoComplete="off">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 12 }}>
              <Typography gutterBottom variant="h6">
                Account Info <br />
                <span
                  style={{
                    color: me ? "green" : "red",
                    textAlign: "center",
                  }}
                >
                  {me ? "connected" : "not connected"}
                </span>
                <FiberManualRecordIcon
                  style={{
                    color: me ? "green" : "red",
                    fontSize: "14px",
                    marginLeft: "8px",
                  }}
                />
              </Typography>
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                size="small"
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<Assignment fontSize="large" />}
                onClick={() => {
                  navigator.clipboard.writeText(me);
                }}
                style={{ marginTop: 8 }}
                disabled={!name}
                loading={!me}
                loadingPosition="end"
              >
                {!me ? "Generating ID..." : "Copy Your ID"}
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 12 }}>
              <Typography gutterBottom variant="h6">
                Make a call
              </Typography>
              <TextField
                label="ID to call"
                value={idToCall}
                onChange={(e) => setIdToCall(e.target.value)}
                fullWidth
                size="small"
              />
              {callAccepted && !callEnded ? (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<PhoneDisabled fontSize="large" />}
                  fullWidth
                  onClick={leaveCall}
                  style={{ marginTop: 8 }}
                >
                  Hang Up
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Phone fontSize="large" />}
                  fullWidth
                  onClick={() => callUser(idToCall)}
                  style={{ marginTop: 8 }}
                  disabled={!idToCall}
                >
                  Call
                </Button>
              )}
            </Grid>
          </Grid>
        </form>
        <div className="notifications">{children}</div>
      </Paper>
    </Container>
  );
};

export default Sidebar;
