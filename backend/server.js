import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: process.env.PORT || 3000 });

let board = [
    "rnbqkbnr",
    "pppppppp",
    "........",
    "........",
    "........",
    "........",
    "PPPPPPPP",
    "RNBQKBNR"
];

wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.send(JSON.stringify({ type: "state", board }));

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        if (data.type === "move") {
            // update the board
            const piece = board[data.from.row][data.from.col];

            const fromRow = board[data.from.row]
                .split("");
            fromRow[data.from.col] = ".";
            board[data.from.row] = fromRow.join("");

            const toRow = board[data.to.row]
                .split("");
            toRow[data.to.col] = piece;
            board[data.to.row] = toRow.join("");

            // broadcast move to all clients
            wss.clients.forEach((client) => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify(data));
                }
            });
        }
    });
});
