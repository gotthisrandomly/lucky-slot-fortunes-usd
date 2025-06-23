
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchPayments();
    fetchTransactions();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data } = await supabase
        .from('payment_records')
        .select('*')
        .order('created_at', { ascending: false });

      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {payments.length === 0 ? (
              <p>No payment records found</p>
            ) : (
              payments.map((payment: any) => (
                <div key={payment.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-semibold">${payment.amount}</p>
                    <p className="text-sm text-gray-600">
                      {payment.status} - {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm">
                    {payment.payment_method}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <p>No transactions found</p>
            ) : (
              transactions.map((transaction: any) => (
                <div key={transaction.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-semibold">
                      ${transaction.amount} - {transaction.type}
                    </p>
                    <p className="text-sm text-gray-600">
                      {transaction.description}
                    </p>
                  </div>
                  <div className="text-sm">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold text-yellow-800">Bitcoin Integration</p>
              <p className="text-sm text-yellow-700">
                Bitcoin payment processing will be implemented with proper wallet integration
              </p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="font-semibold text-blue-800">USD Payment Processing</p>
              <p className="text-sm text-blue-700">
                Stripe/PayPal integration for credit card and bank transfers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentManagement;
