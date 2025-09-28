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

interface Dare {
  id: number;
  creator: string;
  title: string;
  description: string;
  reward: string;
  deadline: number;
  status: number;
  winner: string;
  rewardClaimed: boolean;
}

interface Submission {
  id: number;
  dareId: number;
  submitter: string;
  proofText: string;
  submittedAt: number;
  approved: boolean;
}

interface DareWithSubmissions extends Dare {
  submissions: Submission[];
}

export const ManageDares = ({ userAddress }: { userAddress: string }) => {
  const [myDares, setMyDares] = useState<DareWithSubmissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDare, setSelectedDare] = useState<DareWithSubmissions | null>(null);
  
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

  useEffect(() => {
    fetchMyDares();
  }, [userAddress]);

  useEffect(() => {
    if (transactionId && !isConfirming) {
      if (isConfirmed) {
        console.log('Action completed successfully!');
        setButtonState('success');
        setTimeout(() => {
          setButtonState(undefined);
          fetchMyDares(); // Refresh the data
        }, 2000);
      } else if (isError) {
        console.error('Transaction failed:', error);
        setButtonState('failed');
        setTimeout(() => {
          setButtonState(undefined);
        }, 3000);
      }
    }
  }, [isConfirmed, isConfirming, isError, error, transactionId]);

  const fetchMyDares = async () => {
    if (!userAddress) return;
    
    try {
      setLoading(true);
      
      const dareCounter = await client.readContract({
        address: DAREFI_CONTRACT_ADDRESS as `0x${string}`,
        abi: DareFiCoreABI,
        functionName: 'dareCounter',
      }) as bigint;

      const dareCount = Number(dareCounter);
      const myDaresList: DareWithSubmissions[] = [];

      for (let i = 1; i <= dareCount; i++) {
        try {
          const dare = await client.readContract({
            address: DAREFI_CONTRACT_ADDRESS as `0x${string}`,
            abi: DareFiCoreABI,
            functionName: 'getDare',
            args: [BigInt(i)],
          }) as any;

          // Only show dares created by this user
          if (dare.creator.toLowerCase() === userAddress.toLowerCase()) {
            // Fetch submissions for this dare
            const submissions = await client.readContract({
              address: DAREFI_CONTRACT_ADDRESS as `0x${string}`,
              abi: DareFiCoreABI,
              functionName: 'getSubmissions',
              args: [BigInt(i)],
            }) as any[];

            const formattedSubmissions: Submission[] = submissions.map((sub, index) => ({
              id: index,
              dareId: Number(sub.dareId),
              submitter: sub.submitter,
              proofText: sub.proofText,
              submittedAt: Number(sub.submittedAt),
              approved: sub.approved,
            }));

            myDaresList.push({
              id: Number(dare.id),
              creator: dare.creator,
              title: dare.title,
              description: dare.description,
              reward: (Number(dare.reward) / 10**18).toString(),
              deadline: Number(dare.deadline),
              status: dare.status,
              winner: dare.winner,
              rewardClaimed: dare.rewardClaimed,
              submissions: formattedSubmissions,
            });
          }
        } catch (error) {
          console.error(`Error fetching dare ${i}:`, error);
        }
      }

      setMyDares(myDaresList);
    } catch (error) {
      console.error('Error fetching my dares:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveSubmission = async (dareId: number, submissionId: number) => {
    setButtonState('pending');
    setTransactionId('');

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: DAREFI_CONTRACT_ADDRESS,
            abi: DareFiCoreABI,
            functionName: 'approveSubmission',
            args: [BigInt(dareId), BigInt(submissionId)],
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
      console.error('Error approving submission:', err);
      setButtonState('failed');
      setTimeout(() => setButtonState(undefined), 3000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className="grid w-full gap-4">
        <p className="text-lg font-semibold">My Dares</p>
        <div className="text-center py-8">
          <p>Loading your dares...</p>
        </div>
      </div>
    );
  }

  if (myDares.length === 0) {
    return (
      <div className="grid w-full gap-4">
        <p className="text-lg font-semibold">My Dares</p>
        <div className="text-center py-8">
          <p className="text-gray-500">You haven't created any dares yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid w-full gap-4">
      <div className="flex justify-between items-center">
        <p className="text-lg font-semibold">My Dares</p>
        <Button
          onClick={fetchMyDares}
          size="sm"
          variant="secondary"
        >
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {myDares.map((dare) => (
          <div key={dare.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-base">{dare.title}</h3>
              <div className="text-right">
                <p className="font-bold text-green-600">{dare.reward} ETH</p>
                <p className="text-xs text-gray-500">
                  {dare.status === 0 ? 'Active' : 'Completed'}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3">{dare.description}</p>

            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-500">
                Deadline: {formatDate(dare.deadline)}
              </p>
              <p className="text-xs text-gray-500">
                {dare.submissions.length} submission(s)
              </p>
            </div>

            {dare.submissions.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-sm font-semibold mb-2">Submissions:</p>
                {dare.submissions.map((submission) => (
                  <div 
                    key={submission.id} 
                    className="p-3 bg-gray-50 rounded mb-2 last:mb-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs text-gray-600">
                        From: {formatAddress(submission.submitter)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(submission.submittedAt)}
                      </p>
                    </div>
                    
                    <p className="text-sm mb-2">{submission.proofText}</p>
                    
                    {dare.status === 0 && !submission.approved && (
                      <LiveFeedback
                        label={{
                          failed: 'Failed to approve',
                          pending: 'Approving...',
                          success: 'Approved!',
                        }}
                        state={buttonState}
                        className="w-full"
                      >
                        <Button
                          onClick={() => approveSubmission(dare.id, submission.id)}
                          disabled={buttonState === 'pending'}
                          size="sm"
                          variant="primary"
                          className="w-full"
                        >
                          Approve Submission
                        </Button>
                      </LiveFeedback>
                    )}
                    
                    {submission.approved && (
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        ✓ Approved - Winner!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {dare.status === 1 && dare.winner && (
              <div className="border-t pt-3">
                <p className="text-sm text-green-600 font-semibold">
                  ✓ Winner: {formatAddress(dare.winner)}
                </p>
                <p className="text-xs text-gray-500">
                  Reward {dare.rewardClaimed ? 'claimed' : 'available to claim'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
