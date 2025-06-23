
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SlotMachine from '@/components/slots/SlotMachine';
import UserBalance from '@/components/casino/UserBalance';
import GameSelector from '@/components/casino/GameSelector';

const Casino = () => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [selectedGame, setSelectedGame] = useState('classic');
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserBalance(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserBalance(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserBalance = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('credits')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching balance:', error);
        // Create balance if it doesn't exist
        const { error: insertError } = await supabase
          .from('user_balances')
          .insert({ user_id: userId, credits: 0 });
        
        if (!insertError) {
          setBalance(0);
        }
      } else if (data) {
        setBalance(data.credits);
      }
    } catch (error) {
      console.error('Error in fetchUserBalance:', error);
    }
  };

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        {/* Casino background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-red-900">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 text-8xl animate-pulse">🎰</div>
            <div className="absolute top-20 right-20 text-7xl">🎲</div>
            <div className="absolute bottom-20 left-20 text-7xl">♠️</div>
            <div className="absolute bottom-10 right-10 text-8xl">💎</div>
          </div>
        </div>
        
        <Card className="w-96 bg-gray-900 border-gray-700 relative z-10">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-white">SlotMansD Casino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-300">Please log in to play</p>
            <Button 
              onClick={() => window.location.href = '/auth'} 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Login / Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden p-4">
      {/* Casino background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-red-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl animate-pulse">🎰</div>
          <div className="absolute top-20 right-20 text-5xl">🎲</div>
          <div className="absolute bottom-20 left-20 text-5xl">♠️</div>
          <div className="absolute bottom-10 right-10 text-6xl">💎</div>
          <div className="absolute top-1/2 left-1/4 text-4xl">🃏</div>
          <div className="absolute top-1/3 right-1/3 text-5xl">♥️</div>
          <div className="absolute bottom-1/3 left-1/2 text-4xl">♣️</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">SlotMansD Casino</h1>
          <p className="text-xl text-red-300">Premium Slot Gaming Experience</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <UserBalance balance={balance} userId={user.id} onBalanceUpdate={updateBalance} />
            <GameSelector selectedGame={selectedGame} onGameSelect={setSelectedGame} />
          </div>

          <div className="lg:col-span-3">
            <SlotMachine 
              gameType={selectedGame}
              userId={user.id}
              balance={balance}
              onBalanceUpdate={updateBalance}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Casino;
