
import React from 'react';

interface EnhancedSlotReelsProps {
  reels: string[][];
  spinning: boolean;
  paylines: number[][];
  winningLines: number[];
}

const EnhancedSlotReels: React.FC<EnhancedSlotReelsProps> = ({ 
  reels, 
  spinning, 
  paylines, 
  winningLines 
}) => {
  const symbolStyles = {
    '🍊': 'text-orange-400 shadow-orange-400/50',
    '🍇': 'text-purple-400 shadow-purple-400/50',
    '7️⃣': 'text-red-400 shadow-red-400/50',
    '💎': 'text-blue-400 shadow-blue-400/50',
    '🔔': 'text-yellow-400 shadow-yellow-400/50',
    '⭐': 'text-amber-400 shadow-amber-400/50',
    '🍒': 'text-red-500 shadow-red-500/50',
    '💰': 'text-green-400 shadow-green-400/50',
    '👑': 'text-yellow-500 shadow-yellow-500/50',
    'BAR': 'text-white shadow-white/50',
  };

  return (
    <div className="relative">
      {/* Paylines visualization */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {winningLines.map((lineIndex) => (
          <div
            key={lineIndex}
            className="absolute w-full h-0.5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 animate-pulse"
            style={{
              top: `${20 + (lineIndex % 3) * 33.33}%`,
              boxShadow: '0 0 10px #fbbf24',
            }}
          />
        ))}
      </div>

      <div className="flex justify-center space-x-1 bg-gradient-to-b from-gray-900 via-black to-gray-900 p-8 rounded-xl border-2 border-yellow-500/30 shadow-2xl">
        {reels.map((reel, reelIndex) => (
          <div 
            key={reelIndex} 
            className="relative bg-gradient-to-b from-gray-800 via-black to-gray-800 rounded-lg border-2 border-yellow-400/40 overflow-hidden shadow-xl"
            style={{ width: '120px', height: '360px' }}
          >
            {/* Reel frame */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-lg pointer-events-none z-20" />
            
            <div 
              className={`
                transition-transform duration-150 
                ${spinning ? 'animate-spin' : ''} 
                flex flex-col
              `}
              style={{
                transform: spinning ? 'translateY(-50px)' : 'translateY(0)',
                animation: spinning ? 'slot-spin 0.1s linear infinite' : 'none',
              }}
            >
              {reel.map((symbol, symbolIndex) => (
                <div
                  key={symbolIndex}
                  className={`
                    w-full h-20 flex items-center justify-center text-5xl font-bold
                    border-b border-yellow-500/20 last:border-b-0 
                    bg-gradient-to-br from-gray-800/80 to-black/80
                    ${symbolStyles[symbol as keyof typeof symbolStyles] || 'text-white shadow-white/50'}
                    ${!spinning ? 'drop-shadow-lg' : ''}
                  `}
                  style={{
                    textShadow: '0 0 20px currentColor',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                  }}
                >
                  {symbol === 'BAR' ? (
                    <div className="bg-gradient-to-r from-red-600 to-red-800 px-3 py-1 rounded text-white text-xl font-bold border border-red-400">
                      BAR
                    </div>
                  ) : (
                    symbol
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slot-spin {
          0% { transform: translateY(0); }
          100% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default EnhancedSlotReels;
