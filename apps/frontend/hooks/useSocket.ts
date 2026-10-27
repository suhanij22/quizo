"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SocketStatus = "connecting" | "open" | "closed";

// Sends an object to the server as JSON. Returns false if the socket isn't open.
export type SendFn = (data: object) => boolean;

type Options = {
  url: string;
  // Runs every time the connection opens (also after a reconnect).
  // Use it to send your first message, e.g. host_join.
  onOpen?: (send: SendFn) => void;
  // Runs for every message the server sends (already parsed from JSON).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMessage?: (message: any) => void;
};

export function useSocket({ url, onOpen, onMessage }: Options) {
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("connecting");
  // Changing this number makes the effect below run again = a new connection
  const [attempt, setAttempt] = useState(0);

  // Keep the latest callbacks in refs, so the socket never has to reconnect
  // just because a callback changed.
  const onOpenRef = useRef(onOpen);
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onOpenRef.current = onOpen;
    onMessageRef.current = onMessage;
  });

  const send = useCallback<SendFn>((data) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    setStatus("connecting");
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("open");
      onOpenRef.current?.(send);
    };

    socket.onmessage = (event) => {
      try {
        onMessageRef.current?.(JSON.parse(event.data));
      } catch {
        // ignore messages that aren't valid JSON
      }
    };

    socket.onclose = () => setStatus("closed");

    // Cleanup: runs when the page closes or before reconnecting
    return () => {
      socket.onmessage = null;
      socket.onclose = null;

      if (socket.readyState === WebSocket.CONNECTING) {
        // Still connecting (this happens in dev because React mounts twice).
        // Closing now makes the browser print a warning, so wait until it opens.
        socket.onopen = () => socket.close();
      } else {
        socket.onopen = null;
        socket.close();
      }
    };
  }, [url, attempt, send]);

  const reconnect = useCallback(() => setAttempt((a) => a + 1), []);

  return { status, send, reconnect };
}



//the warning in console shows because react mounts twice hence first connection open and then closes so it shows that message ,in production build the react mounts only once