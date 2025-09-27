'use client';

import { auth } from '@/auth';
import { ClaimReward } from '@/components/ClaimReward';
import { CreateDare } from '@/components/CreateDare';
import { DareList } from '@/components/DareList';
import { ManageDares } from '@/components/ManageDares';
import { Page } from '@/components/PageLayout';
import { SubmitProof } from '@/components/SubmitProof';
import { UserInfo } from '@/components/UserInfo';
import { Button, Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

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

export default function Home() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'explore' | 'create' | 'manage' | 'rewards'>('explore');
  const [selectedDare, setSelectedDare] = useState<Dare | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');

  useEffect(() => {
    // In a real app, you'd get the user's wallet address from the session or wallet connection
    // For now, we'll use a placeholder
    if (session?.user) {
      // This should come from the wallet connection in a real implementation
      setUserAddress('0x...'); // TODO: Get actual wallet address
    }
  }, [session]);

  const tabs = [
    { id: 'explore', label: 'Explore', icon: '🔍' },
    { id: 'create', label: 'Create', icon: '➕' },
    { id: 'manage', label: 'My Dares', icon: '⚙️' },
    { id: 'rewards', label: 'Rewards', icon: '🏆' },
  ];

  const handleSelectDare = (dare: Dare) => {
    setSelectedDare(dare);
  };

  const handleCloseSubmitProof = () => {
    setSelectedDare(null);
  };

  const handleProofSuccess = () => {
    setSelectedDare(null);
    // Optionally refresh the dare list or show a success message
  };

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="DareFi"
          endAdornment={
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold capitalize">
                {session?.user.username}
              </p>
              <Marble src={session?.user.profilePictureUrl} className="w-12" />
            </div>
          }
        />
      </Page.Header>
      
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex justify-around px-4 py-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              variant={activeTab === tab.id ? 'primary' : 'secondary'}
              size="sm"
              className={`flex items-center gap-1 ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="text-xs">{tab.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <Page.Main className="flex flex-col items-center justify-start gap-6 mb-16 px-4">
        {/* User Info - Show on all tabs */}
        <div className="w-full max-w-md">
          <UserInfo />
        </div>

        {/* Tab Content */}
        <div className="w-full max-w-md">
          {activeTab === 'explore' && (
            <DareList onSelectDare={handleSelectDare} />
          )}
          
          {activeTab === 'create' && (
            <CreateDare />
          )}
          
          {activeTab === 'manage' && (
            <ManageDares userAddress={userAddress} />
          )}
          
          {activeTab === 'rewards' && (
            <ClaimReward userAddress={userAddress} />
          )}
        </div>

        {/* Submit Proof Modal */}
        {selectedDare && (
          <SubmitProof
            dare={selectedDare}
            onClose={handleCloseSubmitProof}
            onSuccess={handleProofSuccess}
          />
        )}
      </Page.Main>
    </>
  );
}
