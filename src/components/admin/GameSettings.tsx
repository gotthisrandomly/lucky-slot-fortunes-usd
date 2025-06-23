
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const GameSettings = () => {
  const [settings, setSettings] = useState({
    rtp: 90,
    maxBet: 100,
    minBet: 1,
    jackpotMultiplier: 1000
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['rtp', 'max_bet', 'min_bet', 'jackpot_multiplier']);

      if (data) {
        const settingsObj = data.reduce((acc: any, item: any) => {
          acc[item.setting_key] = item.setting_value;
          return acc;
        }, {});

        setSettings({
          rtp: settingsObj.rtp || 90,
          maxBet: settingsObj.max_bet || 100,
          minBet: settingsObj.min_bet || 1,
          jackpotMultiplier: settingsObj.jackpot_multiplier || 1000
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSetting = async (key: string, value: number) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          description: `Game setting: ${key}`
        });

      if (error) throw error;

      toast({
        title: "Setting updated",
        description: `${key} has been updated to ${value}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>RTP Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="rtp">Return to Player (%)</Label>
            <Input
              id="rtp"
              type="number"
              value={settings.rtp}
              onChange={(e) => setSettings({...settings, rtp: parseInt(e.target.value)})}
              min="50"
              max="99"
            />
            <Button 
              onClick={() => updateSetting('rtp', settings.rtp)}
              className="mt-2"
            >
              Update RTP
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bet Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="minBet">Minimum Bet ($)</Label>
            <Input
              id="minBet"
              type="number"
              value={settings.minBet}
              onChange={(e) => setSettings({...settings, minBet: parseInt(e.target.value)})}
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="maxBet">Maximum Bet ($)</Label>
            <Input
              id="maxBet"
              type="number"
              value={settings.maxBet}
              onChange={(e) => setSettings({...settings, maxBet: parseInt(e.target.value)})}
              min="1"
            />
          </div>
          <Button 
            onClick={() => {
              updateSetting('min_bet', settings.minBet);
              updateSetting('max_bet', settings.maxBet);
            }}
          >
            Update Bet Limits
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jackpot Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jackpot">Jackpot Multiplier</Label>
            <Input
              id="jackpot"
              type="number"
              value={settings.jackpotMultiplier}
              onChange={(e) => setSettings({...settings, jackpotMultiplier: parseInt(e.target.value)})}
              min="100"
            />
            <Button 
              onClick={() => updateSetting('jackpot_multiplier', settings.jackpotMultiplier)}
              className="mt-2"
            >
              Update Jackpot
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Game Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Active Games: 3</p>
            <p>Total Spins Today: Loading...</p>
            <p>Average Bet: Loading...</p>
            <p>House Edge: {100 - settings.rtp}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameSettings;
