
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
    const { data, error } = await supabase
      .from('user_balances')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (data) {
      setBalance(data.credits);
    } else if (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">SlotMansD Casino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">Please log in to play</p>
            <Button 
              onClick={() => window.location.href = '/auth'} 
              className="w-full"
            >
              Login / Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">SlotMansD Casino</h1>
          <p className="text-xl text-purple-200">Premium Slot Gaming Experience</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
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
