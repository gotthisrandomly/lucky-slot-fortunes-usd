
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface UserBalanceProps {
  balance: number;
  userId: string;
  onBalanceUpdate: (newBalance: number) => void;
}

const UserBalance: React.FC<UserBalanceProps> = ({ balance, userId, onBalanceUpdate }) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [paymentSessionId, setPaymentSessionId] = useState('');
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
      // Create PayNow payment session through edge function
      const response = await fetch(`https://qyuugweuggzzfcwsvdie.supabase.co/functions/v1/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          userId,
          amount,
          currency: 'USD',
          returnUrl: window.location.href
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment session');
      }

      // Store checkout info and open dialog
      setCheckoutUrl(result.checkout_url);
      setPaymentSessionId(result.session_id);
      setPaymentDialogOpen(true);
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast({
        title: "Payment initiation failed",
        description: error.message || "An error occurred creating payment session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://qyuugweuggzzfcwsvdie.supabase.co/functions/v1/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          userId,
          sessionId: paymentSessionId
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify payment');
      }

      if (result.status === 'completed') {
        onBalanceUpdate(result.balance);
        setDepositAmount('');
        setPaymentDialogOpen(false);
        
        toast({
          title: "Deposit successful!",
          description: `Your payment has been processed successfully`,
        });
      } else {
        toast({
          title: "Payment pending",
          description: "Your payment is still being processed. Please try verifying again in a moment.",
        });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast({
        title: "Payment verification failed",
        description: error.message || "An error occurred verifying your payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // This is a fallback for direct deposit (e.g. for testing)
  const handleDirectDeposit = async () => {
    const amount = parseInt(depositAmount);
    if (!amount || amount <= 0) return;
    
    setLoading(true);
    try {
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount: amount,
          description: `Direct deposit of $${amount}`
        });

      if (transactionError) throw transactionError;

      // Update user balance
      const { data: userBalance, error: balanceFetchError } = await supabase
        .from('user_balances')
        .select('credits, total_deposited')
        .eq('user_id', userId)
        .single();
        
      if (balanceFetchError) throw balanceFetchError;
      
      const newBalance = (userBalance.credits || 0) + amount;
      const newTotalDeposited = (userBalance.total_deposited || 0) + amount;
      
      const { error: balanceError } = await supabase
        .from('user_balances')
        .update({ 
          credits: newBalance,
          total_deposited: newTotalDeposited
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
          payment_method: 'direct_deposit',
          completed_at: new Date().toISOString()
        });

      onBalanceUpdate(newBalance);
      setDepositAmount('');
      
      toast({
        title: "Direct deposit successful!",
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
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleDeposit}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Processing...' : 'Deposit'}
              </Button>
              <Button 
                onClick={handleDirectDeposit}
                disabled={loading}
                variant="outline"
                className="w-full border-green-500 text-green-400 hover:bg-green-900"
              >
                Direct Deposit
              </Button>
            </div>
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
      
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Complete Your Payment</DialogTitle>
            <DialogDescription className="text-gray-300">
              Please complete the payment process with PayNow.gg
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-gray-300">Amount: ${depositAmount}</p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => window.open(checkoutUrl, '_blank')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Payment Page
              </Button>
              <Button
                onClick={handlePaymentVerification}
                variant="outline"
                disabled={loading}
                className="border-green-500 text-green-400 hover:bg-green-900"
              >
                {loading ? 'Verifying...' : 'I\'ve Completed Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserBalance;
