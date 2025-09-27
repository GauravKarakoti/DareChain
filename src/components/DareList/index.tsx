'use client';

import DareFiCoreABI from '@/abi/DareFiCore.json';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { worldchainSepolia } from 'viem/chains';

// Replace with your deployed contract address
const DAREFI_CONTRACT_ADDRESS = '0x...'; // TODO: Update after deployment

interface Dare {
  id: number;
  creator: string;
  title: string;
  description: string;
  reward: string;
  deadline: number;
  status: number; // 0 = ACTIVE, 1 = COMPLETED
  winner: string;
  rewardClaimed: boolean;
}

export const DareList = ({ onSelectDare }: { onSelectDare?: (dare: Dare) => void }) => {
  const [dares, setDares] = useState<Dare[]>([]);
  const [loading, setLoading] = useState(true);
  
  const client = createPublicClient({
    chain: worldchainSepolia,
    transport: http('https://worldchain-sepolia.g.alchemy.com/public'),
  });

  useEffect(() => {
    fetchDares();
  }, []);

  const fetchDares = async () => {
    try {
      setLoading(true);
      
      // Get the current dare counter
      const dareCounter = await client.readContract({
        address: DAREFI_CONTRACT_ADDRESS as `0x${string}`,
        abi: DareFiCoreABI,
        functionName: 'dareCounter',
      }) as bigint;

      const dareCount = Number(dareCounter);
      const fetchedDares: Dare[] = [];

      // Fetch each dare
      for (let i = 1; i <= dareCount; i++) {
        try {
          const dare = await client.readContract({
            address: DAREFI_CONTRACT_ADDRESS as `0x${string}`,
            abi: DareFiCoreABI,
            functionName: 'getDare',
            args: [BigInt(i)],
          }) as any;

          // Only show active dares that haven't expired
          const now = Math.floor(Date.now() / 1000);
          if (dare.status === 0 && dare.deadline > now) {
            fetchedDares.push({
              id: Number(dare.id),
              creator: dare.creator,
              title: dare.title,
              description: dare.description,
              reward: (Number(dare.reward) / 10**18).toString(),
              deadline: Number(dare.deadline),
              status: dare.status,
              winner: dare.winner,
              rewardClaimed: dare.rewardClaimed,
            });
          }
        } catch (error) {
          console.error(`Error fetching dare ${i}:`, error);
        }
      }

      setDares(fetchedDares);
    } catch (error) {
      console.error('Error fetching dares:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeLeft = (deadline: number) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = deadline - now;
    
    if (timeLeft <= 0) return 'Expired';
    
    const days = Math.floor(timeLeft / (24 * 60 * 60));
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="grid w-full gap-4">
        <p className="text-lg font-semibold">Active Dares</p>
        <div className="text-center py-8">
          <p>Loading dares...</p>
        </div>
      </div>
    );
  }

  if (dares.length === 0) {
    return (
      <div className="grid w-full gap-4">
        <p className="text-lg font-semibold">Active Dares</p>
        <div className="text-center py-8">
          <p className="text-gray-500">No active dares found</p>
          <p className="text-sm text-gray-400 mt-2">
            Create the first dare to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid w-full gap-4">
      <div className="flex justify-between items-center">
        <p className="text-lg font-semibold">Active Dares</p>
        <Button
          onClick={fetchDares}
          size="sm"
          variant="secondary"
        >
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-3">
        {dares.map((dare) => (
          <div key={dare.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-base">{dare.title}</h3>
              <div className="text-right">
                <p className="font-bold text-green-600">{dare.reward} ETH</p>
                <p className="text-xs text-gray-500">{formatTimeLeft(dare.deadline)}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-3">{dare.description}</p>
            
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                By: {formatAddress(dare.creator)}
              </p>
              
              {onSelectDare && (
                <Button
                  onClick={() => onSelectDare(dare)}
                  size="sm"
                  variant="primary"
                >
                  Submit Proof
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
