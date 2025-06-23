
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select(`
          *,
          user_balances(credits, total_deposited, total_won),
          user_roles(role)
        `);

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserBalance = async (userId: string, newBalance: number) => {
    try {
      const { error } = await supabase
        .from('user_balances')
        .update({ credits: newBalance })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Balance updated",
        description: "User balance has been updated successfully",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <p className="font-semibold">{user.username || 'No username'}</p>
                <p className="text-sm text-gray-600">ID: {user.id}</p>
                <p className="text-sm">
                  Balance: ${user.user_balances?.[0]?.credits || 0} | 
                  Role: {user.user_roles?.[0]?.role || 'player'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="New balance"
                  className="w-32"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      updateUserBalance(user.id, parseInt(input.value));
                      input.value = '';
                    }
                  }}
                />
                <Button size="sm" variant="outline">
                  Update
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
