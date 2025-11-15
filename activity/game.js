// --- Discord SDK ---
let discord;
let userId;

// --- Backend server URL ---
const BACKEND_URL = "chess-production-64f2.up.railway.app"; 

// WebSocket instance
let socket;

// Chess board representation (simple)
let boardState = [
    "rnbqkbnr",
    "pppppppp",
    "........",
    "........",
    "........",
    "........",
    "PPPPPPPP",
    "RNBQKBNR"
];

let selected = null;

// Render board on screen
function renderBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement("div");
            square.classList.add("square");

            const isDark = (row + col) % 2 === 1;
            square.classList.add(isDark ? "black" : "white");

            square.dataset.row = row;
            square.dataset.col = col;

            const piece = boardState[row][col];
            square.textContent = piece !== "." ? piece : "";

            square.onclick = () => onSquareClick(row, col);

            board.appendChild(square);
        }
    }
}

function movePiece(from, to) {
    const piece = boardState[from.row][from.col];
    boardState[from.row] =
        boardState[from.row].substring(0, from.col) +
        "." +
        boardState[from.row].substring(from.col + 1);

    boardState[to.row] =
        boardState[to.row].substring(0, to.col) +
        piece +
        boardState[to.row].substring(to.col + 1);
}

function onSquareClick(row, col) {
    if (!selected) {
        selected = { row, col };
        return;
    }

    // Send move to backend
    socket.send(
        JSON.stringify({
            type: "move",
            from: selected,
            to: { row, col },
            user: userId
        })
    );

    selected = null;
}

// --- WebSocket Setup ---
function connectBackend() {
    socket = new WebSocket(BACKEND_URL);

    socket.onopen = () => {
        document.getElementById("status").textContent = "Connected ✓";

        socket.send(
            JSON.stringify({
                type: "join",
                user: userId
            })
        );
    };

    socket.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        if (data.type === "state") {
            boardState = data.board;
            renderBoard();
        }

        if (data.type === "move") {
            movePiece(data.from, data.to);
            renderBoard();
        }
    };
}

// --- Discord Activity Init ---
async function init() {
    discord = new DiscordSDK.EmbeddedApp();
    await discord.ready();

    const me = await discord.commands.getCurrentUser();
    userId = me.id;

    renderBoard();
    connectBackend();
}

init();

const socket = new WebSocket("wss://your-project.up.railway.app");

// when connected
socket.onopen = () => {
    console.log("Connected to backend");
};

// receive updates
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "state") {
        renderBoard(data.board);
    }

    if (data.type === "move") {
        makeMoveOnBoard(data.from, data.to);
    }
};

// send moves
function sendMove(from, to) {
    socket.send(JSON.stringify({
        type: "move",
        from,
        to
    }));
}

