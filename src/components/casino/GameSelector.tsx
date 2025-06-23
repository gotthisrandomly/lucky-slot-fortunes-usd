
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GameSelectorProps {
  selectedGame: string;
  onGameSelect: (game: string) => void;
}

const GameSelector: React.FC<GameSelectorProps> = ({ selectedGame, onGameSelect }) => {
  const games = [
    { id: 'classic', name: 'Classic Slots', icon: '🎰' },
    { id: 'fruit', name: 'Fruit Machine', icon: '🍒' },
    { id: 'gems', name: 'Gem Hunter', icon: '💎' }
  ];

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Select Game</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {games.map((game) => (
          <Button
            key={game.id}
            onClick={() => onGameSelect(game.id)}
            variant={selectedGame === game.id ? 'default' : 'outline'}
            className={`w-full justify-start ${
              selectedGame === game.id 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="mr-2">{game.icon}</span>
            {game.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default GameSelector;
