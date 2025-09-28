'use client';

import DareFiCoreABI from '@/abi/DareFiCore.json';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';

// Replace with your deployed contract address
const DAREFI_CONTRACT_ADDRESS = '0x119F1C92DB209Be928aaD48185CC997B9E442261'; // TODO: Update after deployment

interface WinningDare {
  id: number;
  title: string;
  description: string;
  reward: string;
  rewardClaimed: boolean;
}

export const ClaimReward = ({ userAddress }: { userAddress: string }) => {
  const [winningDares, setWinningDares] = useState<WinningDare[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [buttonState, setButtonState] = useState<
    'pending' | 'success' | 'failed' | undefined
  >(undefined);
  
  const [transactionId, setTransactionId] = useState<string>('');
  
  const client = createPublicClient({
    chain: worldchain,
    transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
  });

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError,
    error,
  } = useWaitForTransactionReceipt({
    client: client,
    appConfig: {
      app_id: process.env.NEXT_PUBLIC_APP_ID as `app_${string}`,
    },
    transactionId: transactionId,
  });

  const fetchWinningDares = async () => {
    if (!userAddress) return;
    
    try {
      setLoading(true);
      
      const dareCounter = await client.readContract({
        address: DAREFI_CONTRACT_ADDRESS as `0x${string}`,
        abi: DareFiCoreABI,
        functionName: 'dareCounter',
      }) as bigint;

      const dareCount = Number(dareCounter);
      const winnings: WinningDare[] = [];

      for (let i = 1; i <= dareCount; i++) {
        try {
          const dare = await client.readContract({
            address: DAREFI_CONTRACT_ADDRESS as `0x${string}`,
            abi: DareFiCoreABI,
            functionName: 'getDare',
            args: [BigInt(i)],
          }) as any;

          // Check if user is the winner of this dare
          if (dare.winner && dare.winner.toLowerCase() === userAddress.toLowerCase() && dare.status === 1) {
            winnings.push({
              id: Number(dare.id),
              title: dare.title,
              description: dare.description,
              reward: (Number(dare.reward) / 10**18).toString(),
              rewardClaimed: dare.rewardClaimed,
            });
          }
        } catch (error) {
          console.error(`Error fetching dare ${i}:`, error);
        }
      }

      setWinningDares(winnings);
    } catch (error) {
      console.error('Error fetching winning dares:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinningDares();
  }, [userAddress, fetchWinningDares]);

  useEffect(() => {
    if (transactionId && !isConfirming) {
      if (isConfirmed) {
        console.log('Reward claimed successfully!');
        setButtonState('success');
        setTimeout(() => {
          setButtonState(undefined);
          fetchWinningDares(); // Refresh the data
        }, 2000);
      } else if (isError) {
        console.error('Transaction failed:', error);
        setButtonState('failed');
        setTimeout(() => {
          setButtonState(undefined);
        }, 3000);
      }
    }
  }, [isConfirmed, isConfirming, isError, error, transactionId, fetchWinningDares]);

  const claimReward = async (dareId: number) => {
    setButtonState('pending');
    setTransactionId('');

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: DAREFI_CONTRACT_ADDRESS,
            abi: DareFiCoreABI,
            functionName: 'claimReward',
            args: [BigInt(dareId)],
          },
        ],
      });

      if (finalPayload.status === 'success') {
        console.log('Transaction submitted:', finalPayload.transaction_id);
        setTransactionId(finalPayload.transaction_id);
      } else {
        console.error('Transaction failed:', finalPayload);
        setButtonState('failed');
        setTimeout(() => setButtonState(undefined), 3000);
      }
    } catch (err) {
      console.error('Error claiming reward:', err);
      setButtonState('failed');
      setTimeout(() => setButtonState(undefined), 3000);
    }
  };

  if (loading) {
    return (
      <div className="grid w-full gap-4">
        <p className="text-lg font-semibold">My Rewards</p>
        <div className="text-center py-8">
          <p>Loading rewards...</p>
        </div>
      </div>
    );
  }

  if (winningDares.length === 0) {
    return (
      <div className="grid w-full gap-4">
        <p className="text-lg font-semibold">My Rewards</p>
        <div className="text-center py-8">
          <p className="text-gray-500">No rewards available</p>
          <p className="text-sm text-gray-400 mt-2">
            Complete dares to earn rewards!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid w-full gap-4">
      <div className="flex justify-between items-center">
        <p className="text-lg font-semibold">My Rewards</p>
        <Button
          onClick={fetchWinningDares}
          size="sm"
          variant="secondary"
        >
          Refresh
        </Button>
      </div>

      <div className="grid gap-3">
        {winningDares.map((dare) => (
          <div key={dare.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-base">{dare.title}</h3>
              <div className="text-right">
                <p className="font-bold text-green-600">{dare.reward} ETH</p>
                {dare.rewardClaimed ? (
                  <p className="text-xs text-gray-500">Claimed</p>
                ) : (
                  <p className="text-xs text-blue-600">Available</p>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-3">{dare.description}</p>
            
            {!dare.rewardClaimed && (
              <LiveFeedback
                label={{
                  failed: 'Failed to claim',
                  pending: 'Claiming...',
                  success: 'Claimed!',
                }}
                state={buttonState}
                className="w-full"
              >
                <Button
                  onClick={() => claimReward(dare.id)}
                  disabled={buttonState === 'pending'}
                  size="lg"
                  variant="primary"
                  className="w-full"
                >
                  Claim {dare.reward} ETH
                </Button>
              </LiveFeedback>
            )}
            
            {dare.rewardClaimed && (
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded text-center">
                ✓ Reward Claimed
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
