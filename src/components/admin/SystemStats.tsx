
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const SystemStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWinnings: 0,
    totalSpins: 0,
    activeUsers: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total deposits
      const { data: deposits } = await supabase
        .from('user_balances')
        .select('total_deposited');

      const totalDeposits = deposits?.reduce((sum, user) => sum + (user.total_deposited || 0), 0) || 0;

      // Get total winnings
      const { data: winnings } = await supabase
        .from('user_balances')
        .select('total_won');

      const totalWinnings = winnings?.reduce((sum, user) => sum + (user.total_won || 0), 0) || 0;

      // Get total spins
      const { count: totalSpins } = await supabase
        .from('game_sessions')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        totalDeposits,
        totalWinnings,
        totalSpins: totalSpins || 0,
        activeUsers: totalUsers || 0 // Simplified for now
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">${stats.totalDeposits}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Winnings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">${stats.totalWinnings}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Spins</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.totalSpins}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>House Edge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-purple-600">10%</p>
          <p className="text-sm text-gray-600">90% RTP</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-orange-600">
            ${stats.totalDeposits - stats.totalWinnings}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemStats;
