
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserBalanceProps {
  balance: number;
  userId: string;
  onBalanceUpdate: (newBalance: number) => void;
}

const UserBalance: React.FC<UserBalanceProps> = ({ balance, userId, onBalanceUpdate }) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeposit = async () => {
    const amount = parseInt(depositAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create actual transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount: amount,
          description: `Deposit of $${amount}`
        });

      if (transactionError) throw transactionError;

      // Update user balance
      const newBalance = balance + amount;
      const { error: balanceError } = await supabase
        .from('user_balances')
        .update({ 
          credits: newBalance,
          total_deposited: (await supabase
            .from('user_balances')
            .select('total_deposited')
            .eq('user_id', userId)
            .single()
          ).data?.total_deposited + amount
        })
        .eq('user_id', userId);

      if (balanceError) throw balanceError;

      // Create payment record
      await supabase
        .from('payment_records')
        .insert({
          user_id: userId,
          amount: amount,
          status: 'completed',
          payment_method: 'instant_deposit',
          completed_at: new Date().toISOString()
        });

      onBalanceUpdate(newBalance);
      setDepositAmount('');
      
      toast({
        title: "Deposit successful!",
        description: `$${amount} has been added to your account`,
      });
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast({
        title: "Deposit failed",
        description: error.message || "An error occurred during deposit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Account Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-400 mb-4">
            ${balance}
          </div>
          
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Deposit amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <Button 
              onClick={handleDeposit}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Processing...' : 'Deposit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="pt-6">
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserBalance;
