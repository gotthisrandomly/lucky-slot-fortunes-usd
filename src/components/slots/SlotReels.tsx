
import React from 'react';

interface SlotReelsProps {
  reels: string[][];
  spinning: boolean;
}

const SlotReels: React.FC<SlotReelsProps> = ({ reels, spinning }) => {
  return (
    <div className="flex justify-center space-x-2 bg-black p-4 rounded-lg">
      {reels.map((reel, reelIndex) => (
        <div key={reelIndex} className="bg-white rounded border-2 border-gray-300 overflow-hidden">
          <div className={`transition-transform duration-100 ${spinning ? 'animate-bounce' : ''}`}>
            {reel.map((symbol, symbolIndex) => (
              <div
                key={symbolIndex}
                className="w-20 h-20 flex items-center justify-center text-4xl border-b border-gray-200 last:border-b-0"
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
