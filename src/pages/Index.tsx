
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Casino background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-red-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 text-8xl animate-pulse">🎰</div>
          <div className="absolute top-20 right-20 text-7xl animate-bounce">🎲</div>
          <div className="absolute bottom-20 left-20 text-7xl">♠️</div>
          <div className="absolute bottom-10 right-10 text-8xl animate-pulse">💎</div>
          <div className="absolute top-1/2 left-1/4 text-6xl">🃏</div>
          <div className="absolute top-1/3 right-1/3 text-7xl">♥️</div>
          <div className="absolute bottom-1/3 left-1/2 text-6xl">♣️</div>
          <div className="absolute top-1/4 left-1/2 text-5xl animate-spin">♦️</div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-7xl font-bold text-white mb-4 animate-pulse">SlotMansD</h1>
        <p className="text-3xl text-red-300 mb-12 font-bold">Premium Online Casino Experience</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-black/80 backdrop-blur-md border-red-500/30 hover:border-red-400 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-xl">🎰 3 Premium Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-200">Classic, Fruit, and Gem slot machines with high-winning bonus rounds</p>
            </CardContent>
          </Card>
          
          <Card className="bg-black/80 backdrop-blur-md border-red-500/30 hover:border-red-400 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-xl">💰 90% RTP</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-200">High return-to-player rate with frequent bonus spins and big wins</p>
            </CardContent>
          </Card>
          
          <Card className="bg-black/80 backdrop-blur-md border-red-500/30 hover:border-red-400 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-xl">🔒 Secure Gaming</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-200">Real money gaming with Bitcoin and USD payment support</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-x-6">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 text-lg font-bold"
            onClick={() => window.location.href = '/auth'}
          >
            Join Now
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white px-8 py-4 text-lg font-bold"
            onClick={() => window.location.href = '/casino'}
          >
            Enter Casino
          </Button>
        </div>

        <div className="mt-16 text-sm text-red-300/80">
          <p>Must be 18+ to play. Gambling can be addictive. Play responsibly.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
