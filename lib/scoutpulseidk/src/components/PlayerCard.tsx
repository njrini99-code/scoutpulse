import React from 'react';

interface PlayerStats {
  goals: number;
  assists: number;
  matches: number;
  rating: number;
}

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  age: number;
  nationality: string;
  photo?: string;
  stats: PlayerStats;
  marketValue?: string;
  contract?: {
    expires: string;
    club: string;
  };
}

interface PlayerCardProps {
  player: Player;
  onClick?: (player: Player) => void;
  className?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick, className = '' }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(player);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8.0) return 'text-green-400';
    if (rating >= 7.0) return 'text-yellow-400';
    if (rating >= 6.0) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div
      className={`
        relative p-6 rounded-xl backdrop-blur-2xl bg-white/10 border border-white/15
        hover:bg-white/15 transition-all duration-300 cursor-pointer
        transform hover:scale-105 hover:shadow-xl
        ${className}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-4">
        {/* Player Photo */}
        <div className="relative">
          {player.photo ? (
            <img
              src={player.photo}
              alt={player.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/30 flex items-center justify-center border-2 border-white/20">
              <span className="text-white font-semibold text-lg">
                {player.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500/80 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">{player.stats.rating}</span>
          </div>
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate mb-1">
            {player.name}
          </h3>
          <p className="text-sm text-gray-300 mb-1">
            {player.position} • {player.team}
          </p>
          <p className="text-xs text-gray-400">
            {player.age} years • {player.nationality}
          </p>
        </div>

        {/* Rating */}
        <div className="text-right">
          <div className={`text-2xl font-bold ${getRatingColor(player.stats.rating)}`}>
            {player.stats.rating.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400">Rating</div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{player.stats.goals}</div>
          <div className="text-xs text-gray-400">Goals</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{player.stats.assists}</div>
          <div className="text-xs text-gray-400">Assists</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{player.stats.matches}</div>
          <div className="text-xs text-gray-400">Matches</div>
        </div>
      </div>

      {/* Market Value & Contract */}
      {(player.marketValue || player.contract) && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex justify-between items-center text-xs text-gray-400">
            {player.marketValue && (
              <span>Value: {player.marketValue}</span>
            )}
            {player.contract && (
              <span>Contract: {player.contract.expires}</span>
            )}
          </div>
        </div>
      )}

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default PlayerCard;