
import React from 'react';

interface SlotReelsProps {
  reels: string[][];
  spinning: boolean;
}

const SlotReels: React.FC<SlotReelsProps> = ({ reels, spinning }) => {
  return (
    <div className="flex justify-center space-x-2 bg-gray-900 p-6 rounded-lg border border-red-500/30">
      {reels.map((reel, reelIndex) => (
        <div key={reelIndex} className="bg-black rounded border-2 border-red-400 overflow-hidden shadow-lg">
          <div className={`transition-transform duration-100 ${spinning ? 'animate-bounce' : ''}`}>
            {reel.map((symbol, symbolIndex) => (
              <div
                key={symbolIndex}
                className="w-20 h-20 flex items-center justify-center text-4xl border-b border-red-500/30 last:border-b-0 bg-gradient-to-b from-gray-800 to-black"
              >
                {symbol}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SlotReels;
