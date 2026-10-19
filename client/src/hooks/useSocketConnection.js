import { useEffect, useState } from "react";
import { socket } from "../socket";

export function useSocketConnection(token, onUnauthorized) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    function handleConnect() {
      setConnected(true);
    }

    function handleDisconnect() {
      setConnected(false);
    }

    function handleConnectError(err) {
      setConnected(false);
      if (err.message === "Unauthorized") {
        onUnauthorized();
      }
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.auth = { token };
    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
      setConnected(false);
    };
  }, [token, onUnauthorized]);

  return connected;
}
