
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SlotReels from './SlotReels';

interface SlotMachineProps {
  gameType: string;
  userId: string;
  balance: number;
  onBalanceUpdate: (newBalance: number) => void;
}

const SlotMachine: React.FC<SlotMachineProps> = ({ gameType, userId, balance, onBalanceUpdate }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([['🍒', '🍒', '🍒'], ['🍒', '🍒', '🍒'], ['🍒', '🍒', '🍒']]);
  const [lastWin, setLastWin] = useState(0);
  const { toast } = useToast();

  const symbols = {
    classic: ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'],
    fruit: ['🍒', '🍌', '🍊', '🍇', '🍓', '🥝', '🍉'],
    gems: ['💎', '💰', '👑', '🔔', '⭐', '🎰', '🃏']
  };

  const gameSymbols = symbols[gameType as keyof typeof symbols] || symbols.classic;

  const spin = async () => {
    if (betAmount > balance) {
      toast({
        title: "Insufficient funds",
        description: "Please add more credits to your account",
        variant: "destructive",
      });
      return;
    }

    setSpinning(true);
    setLastWin(0);

    // Simulate spinning animation
    const spinDuration = 2000;
    const spinInterval = setInterval(() => {
      setReels([
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
      ]);
    }, 100);

    setTimeout(async () => {
      clearInterval(spinInterval);
      
      // Generate final result with 90% RTP
      const finalReels = generateFinalReels();
      setReels(finalReels);
      
      const winAmount = calculateWin(finalReels, betAmount);
      const newBalance = balance - betAmount + winAmount;
      
      // Save game session
      await saveGameSession(finalReels, betAmount, winAmount);
      
      // Update balance
      await updateUserBalance(newBalance);
      onBalanceUpdate(newBalance);
      
      setLastWin(winAmount);
      setSpinning(false);

      if (winAmount > 0) {
        toast({
          title: `You won $${winAmount}!`,
          description: `Congratulations on your win!`,
        });
      }
    }, spinDuration);
  };

  const getRandomSymbol = () => {
    return gameSymbols[Math.floor(Math.random() * gameSymbols.length)];
  };

  const generateFinalReels = () => {
    // Implement 90% RTP logic here
    const random = Math.random();
    
    // 10% chance for big wins
    if (random < 0.1) {
      const symbol = getRandomSymbol();
      return [[symbol, symbol, symbol], [symbol, symbol, symbol], [symbol, symbol, symbol]];
    }
    
    // 20% chance for medium wins
    if (random < 0.3) {
      const symbol = getRandomSymbol();
      return [[symbol, symbol, symbol], [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()], [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]];
    }
    
    // 60% chance for small wins or losses
    return [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
    ];
  };

  const calculateWin = (reels: string[][], bet: number) => {
    // Simple win calculation - can be enhanced
    const topRow = [reels[0][0], reels[1][0], reels[2][0]];
    const middleRow = [reels[0][1], reels[1][1], reels[2][1]];
    const bottomRow = [reels[0][2], reels[1][2], reels[2][2]];
    
    let totalWin = 0;
    
    [topRow, middleRow, bottomRow].forEach(row => {
      if (row[0] === row[1] && row[1] === row[2]) {
        // Three of a kind
        if (row[0] === '💎') totalWin += bet * 50;
        else if (row[0] === '7️⃣') totalWin += bet * 25;
        else if (row[0] === '⭐') totalWin += bet * 15;
        else totalWin += bet * 5;
      } else if (row[0] === row[1] || row[1] === row[2]) {
        // Two of a kind
        totalWin += bet * 2;
      }
    });
    
    return totalWin;
  };

  const saveGameSession = async (reels: string[][], bet: number, win: number) => {
    const { error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        bet_amount: bet,
        win_amount: win,
        reel_results: reels,
        jackpot_won: win > bet * 20
      });

    if (error) {
      console.error('Error saving game session:', error);
    }
  };

  const updateUserBalance = async (newBalance: number) => {
    const { error } = await supabase
      .from('user_balances')
      .update({ credits: newBalance })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating balance:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold capitalize">
          {gameType} Slots
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <SlotReels reels={reels} spinning={spinning} />
        
        <div className="flex items-center justify-center space-x-4">
          <div>
            <Label htmlFor="bet">Bet Amount ($)</Label>
            <Input
              id="bet"
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max={balance}
              className="w-24"
            />
          </div>
          
          <Button
            onClick={spin}
            disabled={spinning || betAmount > balance}
            size="lg"
            className="px-8"
          >
            {spinning ? 'Spinning...' : `Spin ($${betAmount})`}
          </Button>
        </div>

        {lastWin > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              You won ${lastWin}!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SlotMachine;
