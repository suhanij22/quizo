// Usage: pnpm exec tsx test-player.ts <joinCode> <username>
import WebSocket from "ws";

const [joinCode, username = "guest"] = process.argv.slice(2);
if (!joinCode) {
  console.log("usage: pnpm exec tsx test-player.ts <joinCode> <username>");
  process.exit(1);
}

const ws = new WebSocket("ws://localhost:8080");

ws.on("open", () => {
  ws.send(JSON.stringify({ type: "join_session", joinCode, username }));
});

ws.on("message", (raw) => {
  const msg = JSON.parse(raw.toString());
  const tag = `[${username}]`;

  switch (msg.type) {
    case "question_started": {
      console.log(tag, `Q${msg.index + 1}/${msg.total}:`, msg.question.text);
      // pick a random option after 1-4 seconds
      const options = msg.question.options;
      const pick = options[Math.floor(Math.random() * options.length)];
      setTimeout(() => {
        ws.send(
          JSON.stringify({
            type: "submit_answer",
            questionId: msg.question.id,
            optionId: pick.id,
          })
        );
      }, 1000 + Math.random() * 3000);
      break;
    }
    case "question_ended":
      console.log(tag, "result:", msg.yourResult, "| top player:", msg.leaderboard[0]);
      break;
    case "quiz_ended":
      console.log(tag, "FINAL:", msg.leaderboard);
      ws.close();
      break;
    default:
      console.log(tag, msg.type, JSON.stringify(msg));
  }
});