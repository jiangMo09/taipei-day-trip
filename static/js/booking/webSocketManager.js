import { decodeJWT } from "../utils/decodeJwt.js";

export const initializeWebSocket = (authToken, onRefreshBooking) => {
  if (!authToken) {
    return;
  }

  const { id } = decodeJWT(authToken);

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/api/ws/${id}`;

  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("WebSocket connected successfully");
  };

  socket.onmessage = ({ data }) => {
    const parsedData = JSON.parse(data);
    if (parsedData.action === "refresh_booking") {
      onRefreshBooking();
    }
  };

  socket.onclose = (event) => {
    console.log("WebSocket connection closed", event);
    setTimeout(() => initializeWebSocket(authToken, onRefreshBooking), 1000);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return socket;
};
