import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { worldchain, worldchainSepolia, filecoinCalibration, sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'DareX',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT as string,
  chains: [worldchain, worldchainSepolia, filecoinCalibration, sepolia],
  ssr: true, // Required for server-side rendering
});