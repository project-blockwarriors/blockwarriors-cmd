package ai.blockwarriors.beacon.service;

import io.socket.client.IO;
import io.socket.client.Socket;

import java.net.URI;
import java.util.Collections;
import java.util.logging.Logger;

public class SocketService {
    private final Socket socket;
    private final Logger logger;

    public SocketService(ai.blockwarriors.beacon.Plugin plugin, URI uri) {
        this.logger = plugin.getLogger();

        IO.Options options = IO.Options.builder()
                .setAuth(Collections.singletonMap("token", "test"))
                .build();

        socket = IO.socket(uri, options);
        setupSocketListeners();
        socket.connect();
    }

    private void setupSocketListeners() {
        socket.on(Socket.EVENT_CONNECT,
                objects -> logger.info("Connected to Socket.IO server with ID: " + socket.id()));

        socket.on("message-new", args -> logger.info("Received message: " + args[0]));

        socket.on("player-move", args -> logger.info("Received player-move event: " + args[0]));
    }

    public Socket getSocket() {
        return socket;
    }

    public void disconnect() {
        if (socket != null && socket.connected()) {
            socket.disconnect();
        }
    }
}
