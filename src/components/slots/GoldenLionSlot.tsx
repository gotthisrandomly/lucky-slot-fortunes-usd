import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GoldenLionSlotProps {
  gameType: string;
  userId: string;
  balance: number;
  onBalanceUpdate: (newBalance: number) => void;
}

const GoldenLionSlot: React.FC<GoldenLionSlotProps> = ({
  gameType,
  userId,
  balance,
  onBalanceUpdate,
}) => {
  const [betAmount, setBetAmount] = useState(1.50);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([
    ['🦁', '👑', '💎', '🔔', 'A'],
    ['🦁', '👑', '💎', '🔔', 'A'],
    ['🦁', '👑', '💎', '🔔', 'A'],
    ['🦁', '👑', '💎', '🔔', 'A'],
    ['🦁', '👑', '💎', '🔔', 'A']
  ]);
  const [lastWin, setLastWin] = useState(0);
  const [freeSpins, setFreeSpins] = useState(0);
  const [bonusRound, setBonusRound] = useState(false);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [totalWays, setTotalWays] = useState(243);
  const { toast } = useToast();

  const symbols = ['🦁', '👑', '💎', '🔔', '⚡', '🌟', 'A', 'K', 'Q', 'J', '10', '9'];
  
  const betOptions = [0.25, 0.50, 1.00, 1.50, 2.50, 5.00, 10.00, 25.00];

  const jackpots = {
    grand: 2000.00,
    major: 400.00,
    minor: 99.20,
    mini: 40.00
  };

  const spin = async () => {
    if (betAmount > balance) {
      toast({
        title: "Insufficient funds",
        description: `You need $${betAmount} to play`,
        variant: "destructive",
      });
      return;
    }

    setSpinning(true);
    setLastWin(0);
    setWinningLines([]);

    // Enhanced spinning animation
    const spinDuration = 4000;
    const spinInterval = setInterval(() => {
      setReels([
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
      ]);
    }, 100);

    setTimeout(async () => {
      clearInterval(spinInterval);
      
      const finalReels = generateFinalReels();
      setReels(finalReels);
      
      const { winAmount, winLines, bonusTriggered, freeSpinsAwarded, jackpotWon } = calculateWin(finalReels, betAmount);
      
      setWinningLines(winLines);
      
      let newBalance = balance - betAmount + winAmount;
      
      // Handle bonus features
      if (bonusTriggered) {
        setBonusRound(true);
        const bonusWin = Math.floor(Math.random() * betAmount * 15) + betAmount * 10;
        newBalance += bonusWin;
        toast({
          title: "🎆 BONUS ROUND! 🎆",
          description: `You won an additional $${bonusWin} in the bonus round!`,
        });
      }
      
      if (freeSpinsAwarded > 0) {
        setFreeSpins(prev => prev + freeSpinsAwarded);
        toast({
          title: "🎉 FREE SPINS! 🎉",
          description: `You won ${freeSpinsAwarded} free spins!`,
        });
      }

      if (jackpotWon) {
        toast({
          title: "🏆 JACKPOT WON! 🏆",
          description: `Congratulations! You won the ${jackpotWon} jackpot!`,
        });
      }

      // Save game session
      await saveGameSession(finalReels, betAmount, winAmount, winLines, bonusTriggered, freeSpinsAwarded);
      
      await updateUserBalance(newBalance);
      onBalanceUpdate(newBalance);
      
      setLastWin(winAmount);
      setSpinning(false);

      if (winAmount > 0) {
        toast({
          title: `🎉 YOU WON $${winAmount.toFixed(2)}! 🎉`,
          description: `${winLines.length} winning ways!`,
        });
      }

      // Auto-trigger free spin
      if (freeSpins > 0 && !spinning) {
        setTimeout(() => {
          if (freeSpins > 0) {
            setFreeSpins(prev => prev - 1);
            spin();
          }
        }, 3000);
      }
    }, spinDuration);
  };

  const getRandomSymbol = () => {
    return symbols[Math.floor(Math.random() * symbols.length)];
  };

  const generateFinalReels = () => {
    const random = Math.random();
    
    // 3% chance for jackpot (five lions)
    if (random < 0.03) {
      return [['🦁', '🦁', '🦁', '🦁', '🦁'], ['🦁', '🦁', '🦁', '🦁', '🦁'], ['🦁', '🦁', '🦁', '🦁', '🦁'], ['🦁', '🦁', '🦁', '🦁', '🦁'], ['🦁', '🦁', '🦁', '🦁', '🦁']];
    }
    
    // 10% chance for big wins
    if (random < 0.13) {
      const symbol = symbols[Math.floor(Math.random() * 6)]; // Favor higher value symbols
      const reels = [
        [symbol, getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [symbol, getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [symbol, getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [symbol, getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [symbol, getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
      ];
      return reels;
    }
    
    return [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
    ];
  };

  const calculateWin = (reels: string[][], bet: number) => {
    let totalWin = 0;
    const winLines: number[] = [];
    let bonusTriggered = false;
    let freeSpinsAwarded = 0;
    let jackpotWon = '';

    // Check for 243 ways to win
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        const symbol = reels[i][j];
        let consecutiveCount = 1;
        
        // Count consecutive symbols from left to right
        for (let k = i + 1; k < 5; k++) {
          if (reels[k].includes(symbol)) {
            consecutiveCount++;
          } else {
            break;
          }
        }
        
        if (consecutiveCount >= 3) {
          winLines.push(i * 5 + j);
          
          // Calculate win multiplier based on symbol and count
          let multiplier = 1;
          switch (symbol) {
            case '🦁': 
              multiplier = consecutiveCount === 5 ? 500 : consecutiveCount === 4 ? 100 : 25;
              if (consecutiveCount === 5) jackpotWon = 'GRAND';
              break;
            case '👑': 
              multiplier = consecutiveCount === 5 ? 250 : consecutiveCount === 4 ? 50 : 15;
              if (consecutiveCount === 5) jackpotWon = 'MAJOR';
              break;
            case '💎': multiplier = consecutiveCount === 5 ? 150 : consecutiveCount === 4 ? 30 : 10; break;
            case '🔔': multiplier = consecutiveCount === 5 ? 100 : consecutiveCount === 4 ? 20 : 8; break;
            case '⚡': multiplier = consecutiveCount === 5 ? 75 : consecutiveCount === 4 ? 15 : 6; break;
            case '🌟': multiplier = consecutiveCount === 5 ? 50 : consecutiveCount === 4 ? 12 : 5; break;
            case 'A': multiplier = consecutiveCount === 5 ? 40 : consecutiveCount === 4 ? 10 : 4; break;
            case 'K': multiplier = consecutiveCount === 5 ? 30 : consecutiveCount === 4 ? 8 : 3; break;
            case 'Q': multiplier = consecutiveCount === 5 ? 25 : consecutiveCount === 4 ? 6 : 2.5; break;
            case 'J': multiplier = consecutiveCount === 5 ? 20 : consecutiveCount === 4 ? 5 : 2; break;
            default: multiplier = consecutiveCount === 5 ? 15 : consecutiveCount === 4 ? 4 : 1.5; break;
          }
          
          totalWin += bet * multiplier;
          
          // Bonus triggers
          if (symbol === '🌟' && consecutiveCount >= 3) {
            freeSpinsAwarded += consecutiveCount;
          }
          if (symbol === '⚡' && consecutiveCount >= 4) {
            bonusTriggered = true;
          }
        }
      }
    }

    return { winAmount: totalWin, winLines, bonusTriggered, freeSpinsAwarded, jackpotWon };
  };

  const saveGameSession = async (reels: string[][], bet: number, win: number, winLines: number[], bonus: boolean, freeSpins: number) => {
    const { error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        bet_amount: bet,
        win_amount: win,
        reel_results: reels,
        jackpot_won: win > bet * 100,
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
    <div className="w-full max-w-6xl mx-auto">
      {/* Background with cosmic theme */}
      <div 
        className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 rounded-2xl overflow-hidden"
        style={{
          backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><circle cx="200" cy="300" r="2" fill="white" opacity="0.8"/><circle cx="800" cy="200" r="1.5" fill="white" opacity="0.6"/><circle cx="400" cy="700" r="1" fill="white" opacity="0.4"/><circle cx="600" cy="500" r="2.5" fill="white" opacity="0.7"/></svg>')`,
        }}
      >
        {/* Jackpot Display */}
        <div className="p-6 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-b border-yellow-500/30">
          <h1 className="text-center text-4xl font-bold text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text mb-4">
            🦁 GREAT GOLDEN LION 🦁
          </h1>
          
          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-yellow-600 to-orange-700 p-3 rounded-lg border-2 border-yellow-400 text-center">
              <div className="text-xs text-yellow-100">GRAND</div>
              <div className="text-lg font-bold text-white">${jackpots.grand.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-3 rounded-lg border-2 border-blue-400 text-center">
              <div className="text-xs text-blue-100">MAJOR</div>
              <div className="text-lg font-bold text-white">${jackpots.major.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-teal-700 p-3 rounded-lg border-2 border-green-400 text-center">
              <div className="text-xs text-green-100">MINOR</div>
              <div className="text-lg font-bold text-white">${jackpots.minor.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-pink-600 to-purple-700 p-3 rounded-lg border-2 border-pink-400 text-center">
              <div className="text-xs text-pink-100">MINI</div>
              <div className="text-lg font-bold text-white">${jackpots.mini.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Slot Reels */}
        <div className="p-8">
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 p-6 rounded-xl border-2 border-yellow-500/50 backdrop-blur-sm">
            <div className="grid grid-cols-5 gap-2">
              {reels.map((reel, reelIndex) => (
                <div key={reelIndex} className="space-y-1">
                  {reel.map((symbol, symbolIndex) => (
                    <div
                      key={symbolIndex}
                      className={`
                        w-20 h-20 bg-gradient-to-br from-amber-900/50 to-red-900/50 
                        border-2 border-yellow-500/30 rounded-lg 
                        flex items-center justify-center text-3xl font-bold
                        transition-all duration-300
                        ${spinning ? 'animate-bounce blur-sm' : 'hover:scale-105'}
                        ${winningLines.includes(reelIndex * 5 + symbolIndex) ? 'ring-4 ring-yellow-400 ring-opacity-75 animate-pulse' : ''}
                      `}
                      style={{
                        textShadow: '0 0 10px currentColor',
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                      }}
                    >
                      {symbol}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 bg-black/30 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Balance and Stats */}
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-sm text-gray-300">BALANCE</div>
                <div className="text-2xl font-bold text-green-400">${balance.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-300">WIN</div>
                <div className="text-2xl font-bold text-yellow-400">${lastWin.toFixed(2)}</div>
              </div>
            </div>

            {/* Spin Button */}
            <div className="flex flex-col items-center space-y-4">
              <Button
                onClick={spin}
                disabled={spinning || betAmount > balance}
                size="lg"
                className={`
                  w-24 h-24 rounded-full text-xl font-bold transform transition-all duration-300
                  ${spinning 
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 animate-spin' 
                    : 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-400 hover:via-emerald-400 hover:to-green-500 hover:scale-110 shadow-lg hover:shadow-2xl'
                  }
                  border-4 border-white
                `}
                style={{
                  boxShadow: spinning 
                    ? 'none' 
                    : '0 0 30px rgba(34, 197, 94, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.3)',
                }}
              >
                {spinning ? '⟳' : '▶'}
              </Button>
              
              <div className="text-center">
                <div className="text-sm text-gray-300">{totalWays} WAYS</div>
                {freeSpins > 0 && (
                  <div className="text-lg font-bold text-yellow-400 animate-pulse">
                    FREE SPINS: {freeSpins}
                  </div>
                )}
              </div>
            </div>

            {/* Bet Controls */}
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-sm text-gray-300">BET</div>
                <div className="text-2xl font-bold text-orange-400">${betAmount.toFixed(2)}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-1">
                {betOptions.map(amount => (
                  <Button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    variant={betAmount === amount ? "default" : "outline"}
                    size="sm"
                    className={`text-xs ${
                      betAmount === amount 
                        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                        : 'border-orange-500/50 text-orange-400 hover:bg-orange-500/20'
                    }`}
                  >
                    ${amount.toFixed(2)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {lastWin > 0 && (
            <div className="mt-6 text-center bg-gradient-to-r from-yellow-900/50 to-orange-900/50 p-4 rounded-lg border border-yellow-500/50 animate-pulse">
              <p className="text-3xl font-bold text-yellow-400">
                🎉 BIG WIN ${lastWin.toFixed(2)}! 🎉
              </p>
              <p className="text-orange-300">
                {winningLines.length} winning ways • {totalWays} ways to win
              </p>
            </div>
          )}

          {bonusRound && (
            <div className="mt-4 text-center bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4 rounded-lg border border-purple-500/50 animate-pulse">
              <p className="text-2xl font-bold text-purple-400">
                🎆 BONUS ROUND ACTIVE! 🎆
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoldenLionSlot;
