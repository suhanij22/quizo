import { WebSocketServer } from "ws";

type Room={
    players:Map<string,{socket:WebSocket;username:string}>;
};

//joincode->room
const rooms=new Map<string,Room>();

const wss = new WebSocketServer({ port: 8080 });

// send one JSON message to one socket
function send(socket: WebSocket, data: object) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

// send a JSON message to everyone in a room (optionally skip one player)
function broadcast(room: Room, data: object, exceptId?: string) {
  for (const [id, player] of room.players) {
    if (id !== exceptId) send(player.socket, data);
  }
}

wss.on("connection", (socket) => {
  console.log("client connected");

  //it remembers who this socket is ,once they join
  let current:{joinCode:string;playerId:string}|null=null;

socket.on("message", (data) => {
  let msg:any;
  try {
    msg = JSON.parse(data.toString());
  } catch {
    socket.send(JSON.stringify({ type: "error", message: "invalid JSON" }));
    return;
  }

  switch (msg.type) {
    case "join_session":
      console.log("someone wants to join", msg.joinCode);
      break;
    default:
      socket.send(JSON.stringify({ type: "error", message: "unknown type" }));
  }
});

  socket.on("close", () => console.log("client disconnected"));
});

console.log("ws server on 8080");