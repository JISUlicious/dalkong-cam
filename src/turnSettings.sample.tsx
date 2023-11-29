const openRelayTurnServer = {
  iceServers: [
    {
      urls: "stun:stun.server.url:port",
    },
    {
      urls: "turn:turn.server.url:port",
      username: "username",
      credential: "credential",
    },
  ],
};

export default openRelayTurnServer;