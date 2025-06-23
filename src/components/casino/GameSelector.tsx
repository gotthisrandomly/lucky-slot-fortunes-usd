
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
    <Card>
      <CardHeader>
        <CardTitle>Select Game</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {games.map((game) => (
          <Button
            key={game.id}
            onClick={() => onGameSelect(game.id)}
            variant={selectedGame === game.id ? 'default' : 'outline'}
            className="w-full justify-start"
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
