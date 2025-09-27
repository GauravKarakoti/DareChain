'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'

interface Web3ContextType {
  provider: ethers.BrowserProvider | null
  account: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  isConnected: boolean
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [account, setAccount] = useState<string | null>(null)

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const ethereum = (window as any).ethereum
        await ethereum.request({ method: 'eth_requestAccounts' })
        
        const newProvider = new ethers.BrowserProvider(ethereum)
        const signer = await newProvider.getSigner()
        const address = await signer.getAddress()
        
        setProvider(newProvider)
        setAccount(address)

        // Listen for account changes
        ethereum.on('accountsChanged', (accounts: string[]) => {
          setAccount(accounts[0] || null)
        })

      } catch (error) {
        console.error('Error connecting wallet:', error)
      }
    } else {
      alert('Please install MetaMask or use a Web3-enabled browser!')
    }
  }

  const disconnectWallet = () => {
    setProvider(null)
    setAccount(null)
  }

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ 
          method: 'eth_accounts' 
        })
        if (accounts.length > 0) {
          connectWallet()
        }
      }
    }

    checkConnection()
  }, [])

  return (
    <Web3Context.Provider value={{
      provider,
      account,
      connectWallet,
      disconnectWallet,
      isConnected: !!account
    }}>
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}