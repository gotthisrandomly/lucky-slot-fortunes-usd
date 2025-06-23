
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EnhancedSlotReels from './EnhancedSlotReels';

interface EnhancedSlotMachineProps {
  gameType: string;
  userId: string;
  balance: number;
  onBalanceUpdate: (newBalance: number) => void;
}

const EnhancedSlotMachine: React.FC<EnhancedSlotMachineProps> = ({
  gameType,
  userId,
  balance,
  onBalanceUpdate,
}) => {
  const [betAmount, setBetAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([
    ['🍊', '🍇', '7️⃣'],
    ['🍊', '🍇', '7️⃣'],
    ['🍊', '🍇', '7️⃣']
  ]);
  const [lastWin, setLastWin] = useState(0);
  const [freeSpins, setFreeSpins] = useState(0);
  const [bonusRound, setBonusRound] = useState(false);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [totalBet, setTotalBet] = useState(0);
  const { toast } = useToast();

  const symbols = ['🍊', '🍇', '7️⃣', '💎', '🔔', '⭐', '🍒', '💰', '👑', 'BAR'];
  
  const paylines = [
    [0, 0, 0], // Top row
    [1, 1, 1], // Middle row
    [2, 2, 2], // Bottom row
    [0, 1, 2], // Diagonal down
    [2, 1, 0], // Diagonal up
  ];

  const betOptions = [1, 5, 10, 25, 50, 100];

  useEffect(() => {
    setTotalBet(betAmount * paylines.length);
  }, [betAmount]);

  const spin = async () => {
    if (totalBet > balance) {
      toast({
        title: "Insufficient funds",
        description: `You need $${totalBet} to play all paylines`,
        variant: "destructive",
      });
      return;
    }

    setSpinning(true);
    setLastWin(0);
    setWinningLines([]);

    // Enhanced spinning animation
    const spinDuration = 3000;
    const spinInterval = setInterval(() => {
      setReels([
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
      ]);
    }, 80);

    setTimeout(async () => {
      clearInterval(spinInterval);
      
      const finalReels = generateFinalReels();
      setReels(finalReels);
      
      const { winAmount, winLines, bonusTriggered, freeSpinsAwarded } = calculateWin(finalReels, betAmount);
      
      setWinningLines(winLines);
      
      let newBalance = balance - totalBet + winAmount;
      
      // Handle bonus features
      if (bonusTriggered) {
        setBonusRound(true);
        const bonusWin = Math.floor(Math.random() * betAmount * 10) + betAmount * 5;
        newBalance += bonusWin;
        toast({
          title: "BONUS ROUND!",
          description: `You won an additional $${bonusWin} in the bonus round!`,
        });
      }
      
      if (freeSpinsAwarded > 0) {
        setFreeSpins(prev => prev + freeSpinsAwarded);
        toast({
          title: "FREE SPINS!",
          description: `You won ${freeSpinsAwarded} free spins!`,
        });
      }

      // Save enhanced game session
      await saveGameSession(finalReels, totalBet, winAmount, winLines, bonusTriggered, freeSpinsAwarded);
      
      await updateUserBalance(newBalance);
      onBalanceUpdate(newBalance);
      
      setLastWin(winAmount);
      setSpinning(false);

      if (winAmount > 0) {
        toast({
          title: `You won $${winAmount}!`,
          description: `${winLines.length} winning paylines!`,
        });
      }

      // Auto-trigger free spin
      if (freeSpins > 0 && !spinning) {
        setTimeout(() => {
          if (freeSpins > 0) {
            setFreeSpins(prev => prev - 1);
            spin();
          }
        }, 2000);
      }
    }, spinDuration);
  };

  const getRandomSymbol = () => {
    return symbols[Math.floor(Math.random() * symbols.length)];
  };

  const generateFinalReels = () => {
    const random = Math.random();
    
    // 5% chance for jackpot (three 7s)
    if (random < 0.05) {
      return [['7️⃣', '7️⃣', '7️⃣'], ['7️⃣', '7️⃣', '7️⃣'], ['7️⃣', '7️⃣', '7️⃣']];
    }
    
    // 8% chance for big wins
    if (random < 0.13) {
      const symbol = symbols[Math.floor(Math.random() * 5)]; // Favor higher value symbols
      return [[symbol, symbol, symbol], [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()], [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]];
    }
    
    // 25% chance for medium wins
    if (random < 0.38) {
      const reels = [
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
      ];
      // Force one winning line
      const line = Math.floor(Math.random() * 3);
      const symbol = getRandomSymbol();
      reels[0][line] = symbol;
      reels[1][line] = symbol;
      reels[2][line] = symbol;
      return reels;
    }
    
    return [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
    ];
  };

  const calculateWin = (reels: string[][], bet: number) => {
    let totalWin = 0;
    const winLines: number[] = [];
    let bonusTriggered = false;
    let freeSpinsAwarded = 0;

    // Check each payline
    paylines.forEach((line, lineIndex) => {
      const symbols = [reels[0][line[0]], reels[1][line[1]], reels[2][line[2]]];
      
      if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
        winLines.push(lineIndex);
        
        // Calculate win multiplier based on symbol
        let multiplier = 2;
        switch (symbols[0]) {
          case '7️⃣': multiplier = 100; break;
          case '💎': multiplier = 50; break;
          case '👑': multiplier = 30; break;
          case '💰': multiplier = 25; break;
          case 'BAR': multiplier = 20; break;
          case '⭐': multiplier = 15; break;
          case '🔔': multiplier = 10; break;
          case '🍒': multiplier = 8; break;
          case '🍇': multiplier = 6; break;
          case '🍊': multiplier = 4; break;
        }
        
        totalWin += bet * multiplier;
        
        // Bonus triggers
        if (symbols[0] === '💰') {
          bonusTriggered = true;
        }
        if (symbols[0] === '⭐') {
          freeSpinsAwarded += 3;
        }
      } else if (symbols[0] === symbols[1] || symbols[1] === symbols[2]) {
        // Two matching symbols
        totalWin += bet * 1.5;
      }
    });

    return { winAmount: totalWin, winLines, bonusTriggered, freeSpinsAwarded };
  };

  const saveGameSession = async (reels: string[][], bet: number, win: number, winLines: number[], bonus: boolean, freeSpins: number) => {
    const { error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        bet_amount: bet,
        win_amount: win,
        reel_results: reels,
        jackpot_won: win > bet * 50,
        bonus_triggered: bonus,
        free_spins_won: freeSpins,
        winning_paylines: winLines
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
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-yellow-500/30">
      <CardHeader className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-b border-yellow-500/30">
        <CardTitle className="text-center text-3xl font-bold text-yellow-400 drop-shadow-lg">
          💎 ENHANCED SLOTS 💎
        </CardTitle>
        <div className="text-center text-yellow-300">
          {paylines.length} Paylines • Enhanced Features
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        <EnhancedSlotReels 
          reels={reels} 
          spinning={spinning} 
          paylines={paylines}
          winningLines={winningLines}
        />
        
        {/* Live stats display */}
        <div className="grid grid-cols-3 gap-4 bg-black/50 p-4 rounded-lg border border-yellow-500/30">
          <div className="text-center">
            <div className="text-yellow-400 font-bold">Balance</div>
            <div className="text-2xl text-green-400">${balance}</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-400 font-bold">Total Bet</div>
            <div className="text-2xl text-red-400">${totalBet}</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-400 font-bold">Last Win</div>
            <div className="text-2xl text-green-400">${lastWin}</div>
          </div>
        </div>

        {/* Betting controls */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="bet" className="text-yellow-400 font-bold">Bet Per Line</Label>
            <div className="grid grid-cols-3 gap-2">
              {betOptions.map(amount => (
                <Button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  variant={betAmount === amount ? "default" : "outline"}
                  className={`${
                    betAmount === amount 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-black' 
                      : 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20'
                  }`}
                >
                  ${amount}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-yellow-400 font-bold">Game Features</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-yellow-300">
                <span>Free Spins:</span>
                <span className="text-green-400 font-bold">{freeSpins}</span>
              </div>
              <div className="flex justify-between text-yellow-300">
                <span>Bonus Round:</span>
                <span className={bonusRound ? "text-green-400" : "text-gray-500"}>
                  {bonusRound ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <div className="flex justify-between text-yellow-300">
                <span>Winning Lines:</span>
                <span className="text-green-400 font-bold">{winningLines.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced spin button */}
        <div className="text-center">
          <Button
            onClick={spin}
            disabled={spinning || totalBet > balance}
            size="lg"
            className={`
              px-12 py-6 text-xl font-bold transform transition-all duration-200
              ${spinning 
                ? 'bg-gradient-to-r from-gray-600 to-gray-700 animate-pulse' 
                : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 hover:scale-105 shadow-lg hover:shadow-xl'
              }
              text-black border-2 border-yellow-400
            `}
            style={{
              boxShadow: spinning 
                ? 'none' 
                : '0 0 30px rgba(234, 179, 8, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2)',
            }}
          >
            {spinning ? (
              <span className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                <span>SPINNING...</span>
              </span>
            ) : freeSpins > 0 ? (
              `FREE SPIN! (${freeSpins} left)`
            ) : (
              `SPIN ($${totalBet})`
            )}
          </Button>
        </div>

        {lastWin > 0 && (
          <div className="text-center bg-gradient-to-r from-green-900/50 to-yellow-900/50 p-4 rounded-lg border border-green-500/50">
            <p className="text-3xl font-bold text-green-400 animate-pulse">
              🎉 YOU WON ${lastWin}! 🎉
            </p>
            <p className="text-yellow-300">
              {winningLines.length} winning payline{winningLines.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {bonusRound && (
          <div className="text-center bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4 rounded-lg border border-purple-500/50 animate-pulse">
            <p className="text-2xl font-bold text-purple-400">
              🎆 BONUS ROUND ACTIVE! 🎆
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedSlotMachine;
