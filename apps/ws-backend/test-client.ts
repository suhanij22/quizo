import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:8080");
ws.on("open", () => ws.send("hello"));
ws.on("message", (data) => console.log("got:", data.toString()));