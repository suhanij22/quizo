import { z } from "zod";

// Every message a client (host or player) is allowed to send.
// Anything that doesn't match one of these is rejected.
// Later you can move this file into @repo/common so the frontend can reuse it.

export const ClientMessage = z.discriminatedUnion("type", [
  // host connects to their own session using their login token
  z.object({
    type: z.literal("host_join"),
    joinCode: z.string(),
    token: z.string(),
  }),

  // a player joins with the room code and a nickname
  z.object({
    type: z.literal("join_session"),
    joinCode: z.string().length(6),
    username: z.string().trim().min(1).max(20),
  }),

  // host starts the quiz
  z.object({
    type: z.literal("start_quiz"),
  }),

  // player picks an option for the current question
  z.object({
    type: z.literal("submit_answer"),
    questionId: z.string(),
    optionId: z.string(),
  }),
]);

export type ClientMessage = z.infer<typeof ClientMessage>;