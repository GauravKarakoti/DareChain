'use client';

import DareFiCoreABI from '@/abi/DareFiCore.json';
import { Button, Input, LiveFeedback, TextArea } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { useEffect, useState } from 'react';
import { createPublicClient, http, parseEther } from 'viem';
import { worldchain } from 'viem/chains';

// Replace with your deployed contract address
const DAREFI_CONTRACT_ADDRESS = '0x119F1C92DB209Be928aaD48185CC997B9E442261'; // TODO: Update after deployment

export const CreateDare = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const [buttonState, setButtonState] = useState<'pending' | 'success' | 'failed' | undefined>(undefined);

  const [transactionId, setTransactionId] = useState<string>('');

  // Create a public client for World Chain Sepolia
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
        console.log('Dare created successfully!');
        setButtonState('success');
        // Reset form
        setTitle('');
        setDescription('');
        setReward('');
        setDeadline('');
        setTimeout(() => {
          setButtonState(undefined);
        }, 3000);
      } else if (isError) {
        console.error('Transaction failed:', error);
        setButtonState('failed');
        setTimeout(() => {
          setButtonState(undefined);
        }, 3000);
      }
    }
  }, [isConfirmed, isConfirming, isError, error, transactionId]);

  const onVerify = async () => {
    try {
      const result = await MiniKit.commandsAsync.verify({
        action: 'create-dare',
        verification_level: VerificationLevel.Orb,
      });

      // Verify the proof on the server
      const response = await fetch('/api/verify-proof', {
        method: 'POST',
        body: JSON.stringify({
          payload: result.finalPayload,
          action: 'create-dare',
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

  const onCreateDare = async () => {
    if (!isVerified) {
      alert('Please verify with World ID first');
      return;
    }

    if (!title || !description || !reward || !deadline) {
      alert('Please fill in all fields');
      return;
    }

    const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
    const rewardWei = parseEther(reward);

    setButtonState('pending');
    setTransactionId('');

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: DAREFI_CONTRACT_ADDRESS,
            abi: DareFiCoreABI,
            functionName: 'createDare',
            args: [title, description, deadlineTimestamp],
            value: `0x${rewardWei.toString(16)}`,
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
      console.error('Error creating dare:', err);
      setButtonState('failed');
      setTimeout(() => setButtonState(undefined), 3000);
    }
  };

  return (
    <div className="grid w-full gap-4">
      <p className="text-lg font-semibold">Create a Dare</p>

      {!isVerified && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800 mb-2">You must verify with World ID to create dares</p>
          <Button onClick={onVerify} size="sm" variant="secondary" className="w-full">
            Verify with World ID
          </Button>
        </div>
      )}

      {isVerified && (
        <>
          <Input label="Dare Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <TextArea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <Input
            label="Reward (ETH)"
            type="number"
            step="0.001"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            required
          />
          <Input
            label="Deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />

          <LiveFeedback
            label={{
              failed: 'Failed to create dare',
              pending: 'Creating dare...',
              success: 'Dare created successfully!',
            }}
            state={buttonState}
            className="w-full"
          >
            <Button
              onClick={onCreateDare}
              disabled={buttonState === 'pending' || !isVerified}
              size="lg"
              variant="primary"
              className="w-full"
            >
              Create Dare
            </Button>
          </LiveFeedback>
        </>
      )}
    </div>
  );
};
