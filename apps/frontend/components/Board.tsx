export type BoardEntry={playerId:string;username:string;score:number};

// A list of players with their scores. With `limit`, shows only the top few
// (plus your own row if you are lower down). The host doesn't pass
// `myPlayerId`, so no row is highlighted there.

export default function Board({entries,myPlayerId="",limit}:{entries:BoardEntry[];myPlayerId?:string;limit?:number})
{
    const ranked= entries.map((entry,i)=>({entry,rank:i+1}));
    const top=limit?ranked.slice(0,limit):ranked;
    const mine=myPlayerId? ranked.find((r)=>r.entry.playerId===myPlayerId):undefined;
    const rows= limit&&mine&&mine.rank>limit?[...top,mine]:top;

     return (
    <ul className="space-y-3">
      {rows.map(({ entry, rank }) => (
        <li
          key={entry.playerId}
          className={`flex items-center justify-between gap-3 rounded-2xl border-[3px] border-[#43091f] px-4 py-3 text-lg font-extrabold text-[#43091f] ${
            entry.playerId === myPlayerId ? "bg-[#ffd24a]" : "bg-[#ffc2d1]"
          }`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="w-8 shrink-0 text-center">
              {["🥇", "🥈", "🥉"][rank - 1] ?? rank}
            </span>
            <span className="truncate">
              {entry.username}
              {entry.playerId === myPlayerId ? " (you)" : ""}
            </span>
          </span>
          <span className="shrink-0">{entry.score}</span>
        </li>
      ))}
    </ul>
  );
}