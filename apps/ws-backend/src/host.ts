// Usage: pnpm exec tsx test-host.ts <joinCode> <yourLoginToken>
import WebSocket from "ws";
import readline from "readline";

const [joinCode, token] = process.argv.slice(2);
if (!joinCode || !token) {
  console.log("usage: pnpm exec tsx test-host.ts <joinCode> <token>");
  process.exit(1);
}

const ws = new WebSocket("ws://localhost:8080");
const rl = readline.createInterface({ input: process.stdin });

ws.on("open", () => {
  ws.send(JSON.stringify({ type: "host_join", joinCode, token }));
});

ws.on("message", (raw) => {
  const msg = JSON.parse(raw.toString());
  console.log("[host]", msg.type, JSON.stringify(msg));

  if (msg.type === "host_joined") {
    console.log("\n>>> Wait for players to join, then press ENTER to start the quiz\n");
    rl.once("line", () => ws.send(JSON.stringify({ type: "start_quiz" })));
  }
  if (msg.type === "quiz_ended") {
    ws.close();
    process.exit(0);
  }
});