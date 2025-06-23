
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-white mb-4">SlotMansD</h1>
        <p className="text-2xl text-purple-200 mb-8">Premium Online Casino Experience</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">🎰 3 Premium Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-200">Classic, Fruit, and Gem slot machines with high-winning bonus rounds</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">💰 90% RTP</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-200">High return-to-player rate with frequent bonus spins and big wins</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">🔒 Secure Gaming</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-200">Real money gaming with Bitcoin and USD payment support</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-x-4">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            onClick={() => window.location.href = '/auth'}
          >
            Join Now
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-white text-white hover:bg-white hover:text-black"
            onClick={() => window.location.href = '/casino'}
          >
            Enter Casino
          </Button>
        </div>

        <div className="mt-12 text-sm text-purple-300">
          <p>Must be 18+ to play. Gambling can be addictive. Play responsibly.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
