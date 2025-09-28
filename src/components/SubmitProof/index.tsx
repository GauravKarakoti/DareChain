'use client';

import DareFiCoreABI from '@/abi/DareFiCore.json';
import { Button, LiveFeedback, TextArea } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
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

interface SubmitProofProps {
  dare: Dare | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitProof = ({ dare, onClose, onSuccess }: SubmitProofProps) => {
  const [proofText, setProofText] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  
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
    if (transactionId && !isConfirming) {
      if (isConfirmed) {
        console.log('Proof submitted successfully!');
        setButtonState('success');
        setTimeout(() => {
          setButtonState(undefined);
          onSuccess();
        }, 2000);
      } else if (isError) {
        console.error('Transaction failed:', error);
        setButtonState('failed');
        setTimeout(() => {
          setButtonState(undefined);
        }, 3000);
      }
    }
  }, [isConfirmed, isConfirming, isError, error, transactionId, onSuccess]);

  const onVerify = async () => {
    try {
      const result = await MiniKit.commandsAsync.verify({
        action: 'submit-proof',
        verification_level: VerificationLevel.Orb,
      });

      const response = await fetch('/api/verify-proof', {
        method: 'POST',
        body: JSON.stringify({
          payload: result.finalPayload,
          action: 'submit-proof',
        }),
      });

      const data = await response.json();
      if (data.verifyRes.success) {
        setIsVerified(true);
      } else {
        alert('Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Verification failed. Please try again.');
    }
  };

  const onSubmitProof = async () => {
    if (!isVerified) {
      alert('Please verify with World ID first');
      return;
    }
    
    if (!proofText.trim()) {
      alert('Please enter your proof');
      return;
    }

    if (!dare) {
      alert('No dare selected');
      return;
    }

    setButtonState('pending');
    setTransactionId('');

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: DAREFI_CONTRACT_ADDRESS,
            abi: DareFiCoreABI,
            functionName: 'submitProof',
            args: [BigInt(dare.id), proofText],
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
      console.error('Error submitting proof:', err);
      setButtonState('failed');
      setTimeout(() => setButtonState(undefined), 3000);
    }
  };

  if (!dare) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Submit Proof</h2>
          <Button
            onClick={onClose}
            size="sm"
            variant="secondary"
          >
            ×
          </Button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold">{dare.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{dare.description}</p>
          <p className="text-sm font-bold text-green-600 mt-2">
            Reward: {dare.reward} ETH
          </p>
        </div>

        {!isVerified && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
            <p className="text-sm text-yellow-800 mb-2">
              You must verify with World ID to submit proof
            </p>
            <Button
              onClick={onVerify}
              size="sm"
              variant="secondary"
              className="w-full"
            >
              Verify with World ID
            </Button>
          </div>
        )}

        {isVerified && (
          <>
            <TextArea
              label="Proof Description"
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              placeholder="Describe how you completed this dare. Be specific and include any relevant details..."
              rows={4}
              className="mb-4"
            />

            <div className="flex gap-2">
              <Button
                onClick={onClose}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              
              <LiveFeedback
                label={{
                  failed: 'Failed to submit',
                  pending: 'Submitting...',
                  success: 'Submitted!',
                }}
                state={buttonState}
                className="flex-1"
              >
                <Button
                  onClick={onSubmitProof}
                  disabled={buttonState === 'pending' || !isVerified}
                  variant="primary"
                  className="w-full"
                >
                  Submit Proof
                </Button>
              </LiveFeedback>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
