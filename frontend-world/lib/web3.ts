import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'DareX',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT as string,
  chains: [sepolia],
  ssr: true, // Required for server-side rendering
});