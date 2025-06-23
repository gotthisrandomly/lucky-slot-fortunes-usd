
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserBalanceProps {
  balance: number;
  userId: string;
  onBalanceUpdate: (newBalance: number) => void;
}

const UserBalance: React.FC<UserBalanceProps> = ({ balance, userId, onBalanceUpdate }) => {
  const [depositAmount, setDepositAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeposit = async () => {
    setLoading(true);
    try {
      // In a real app, this would integrate with payment processors
      const newBalance = balance + depositAmount;
      
      const { error } = await supabase
        .from('user_balances')
        .update({ 
          credits: newBalance,
          total_deposited: depositAmount 
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Record transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount: depositAmount,
          description: 'Account deposit'
        });

      onBalanceUpdate(newBalance);
      
      toast({
        title: "Deposit successful!",
        description: `Added $${depositAmount} to your account`,
      });
    } catch (error: any) {
      toast({
        title: "Deposit failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Account Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">${balance}</p>
          <p className="text-sm text-muted-foreground">Available Credits</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="deposit">Add Funds ($)</Label>
          <Input
            id="deposit"
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
          />
          <Button
            onClick={handleDeposit}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Processing...' : 'Deposit'}
          </Button>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full"
        >
          Logout
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserBalance;
