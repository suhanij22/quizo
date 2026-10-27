
import HostLobby from "@/components/HostLobby";
import { Suspense } from "react";

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ joinCode?: string }>;
}) {
  return (
    <Suspense fallback={<div>Loading lobby...</div>}>
      <LobbyContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function LobbyContent({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ joinCode?: string }>;
}) {
  const { sessionId } = await params;
  const { joinCode } = await searchParams;

  if (!sessionId || !joinCode) {
    return <div>Invalid lobby URL. Session ID or join code is missing.</div>;
  }

  return <HostLobby sessionId={sessionId} joinCode={joinCode} />;
}
