'use client';

import { Player, Game } from '@/types/game';
import { Crown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

type PlayerListProps = {
  players: Player[];
  game: Game;
  onPlayerSelect?: (uid: string) => void;
  selectableUids?: string[];
  selectedUid?: string;
  title?: string;
};

export default function PlayerList({
  players,
  game,
  onPlayerSelect,
  selectableUids,
  selectedUid,
  title = 'Players',
}: PlayerListProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {players.map((player) => {
          const isLeader = player.uid === game.leaderId;
          const isActive = player.uid === game.activeTurnUid;
          const isTarget = player.uid === game.targetPlayerUid;
          const isNamed = player.uid === game.namedPlayerUid;
          const isSelectable = selectableUids?.includes(player.uid);

          const PlayerCard = (
            <button
              type="button"
              onClick={() => onPlayerSelect?.(player.uid)}
              disabled={!isSelectable}
              className={cn(
                'p-3 rounded-lg border flex flex-col items-center gap-2 text-center transition-all duration-200 w-full disabled:cursor-default disabled:opacity-60',
                isSelectable && 'hover:border-primary hover:bg-primary/10',
                selectedUid === player.uid
                  ? 'border-primary bg-primary/20 shadow-lg'
                  : 'bg-background/50'
              )}
            >
              <div className="relative">
                <Avatar>
                  <AvatarFallback className="bg-secondary">
                    {player.displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {player.isOnline ? (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                ) : (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-500 border-2 border-background rounded-full"></div>
                )}
              </div>
              <p className="font-semibold truncate w-full">{player.displayName}</p>
              <div className="h-5 flex items-center justify-center">
                {isLeader && (
                  <Badge variant="secondary" className="px-1.5 py-0.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center">
                            <Crown className="h-4 w-4 text-yellow-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Leader</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Badge>
                )}
                {isActive && (
                  <Badge variant="secondary" className="px-1.5 py-0.5">
                    Active
                  </Badge>
                )}
                {isTarget && <Badge variant="secondary">Target</Badge>}
                {isNamed && <Badge variant="destructive">Named</Badge>}
              </div>
            </button>
          );

          if (isSelectable) {
            return (
              <TooltipProvider key={player.uid}>
                <Tooltip>
                  <TooltipTrigger asChild>{PlayerCard}</TooltipTrigger>
                  <TooltipContent>Select {player.displayName}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }
          return <div key={player.uid}>{PlayerCard}</div>;
        })}
      </div>
    </div>
  );
}
