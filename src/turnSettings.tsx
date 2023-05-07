const openRelayTurnServer = {
    iceServers: [
        {
            urls: "stun:a.relay.metered.ca:80",
        },
        {
            urls: "turn:a.relay.metered.ca:80",
            username: "5c1e5827c2ad5794fe489a5a",
            credential: "bobyQXDh9Lfi3pD6",
        },
        {
            urls: "turn:a.relay.metered.ca:443",
            username: "5c1e5827c2ad5794fe489a5a",
            credential: "bobyQXDh9Lfi3pD6",
        },
        {
            urls: "turn:a.relay.metered.ca:443?transport=tcp",
            username: "5c1e5827c2ad5794fe489a5a",
            credential: "bobyQXDh9Lfi3pD6",
        },
    ],
};

export default openRelayTurnServer;