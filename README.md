# DareChain

## Overview

**DareChain** is a decentralized truth-and-dare platform where users can participate in fun challenges while preserving privacy. Participants verify their identities without revealing personal information, submit proof of challenge completion, and engage in microtransactions to bet on the outcomes of others. The platform ensures fair rewards distribution using a decentralized architecture.

This project leverages the following technologies from ETHGlobal New Delhi sponsors:

* **Self Protocol** – For privacy-preserving identity verification.
* **World App Mini App** – Frontend interface for users.
* **PYUSD** – Microtransactions and betting mechanics.
* **Filecoin WARM Storage** – Decentralized storage for photos and videos submitted as proof of dare completion.

## How It Works

1. **Access Mini App**: Users open DareChain as a Mini App within the World App.
2. **Wallet Login**: Users authenticate using their World App wallet.
3. **Identity Verification**: Participants verify their identity via Self Protocol.
4. **Create Dares**: Users or event organizers create dares with associated rewards.
5. **Submit Proof**: Participants attempt the dare and upload photos/videos to Filecoin WARM Storage via the Mini App.
6. **Community Voting / Betting**: The community votes on whether the dare was successfully completed. Microtransactions in PYUSD allow users to bet on outcomes.
7. **Reward Distribution**:

   * Winners who complete the dare receive the dare reward.
   * Users who bet correctly receive payouts from the opposite side of the betting pool.
   * All transactions are transparent and automated via the Mini App.

## Features

* Privacy-preserving identity verification (Self Protocol)
* Decentralized microtransaction betting (PYUSD)
* Long-term decentralized storage for proofs (Filecoin WARM Storage)
* Community-driven challenge validation
* Accessible on mobile through World App Mini App

## Tech Stack

* **Frontend**: World App Mini App
* **Identity Verification**: Self Protocol (on-chain)
* **Payments & Betting**: PYUSD stablecoin
* **Proof Storage**: Filecoin WARM Storage
* **Smart Contracts**: Solidity / EVM-compatible for bets and rewards

## Getting Started

1. **Open World App** and navigate to the DareChain Mini App.
2. **Connect Wallet**: Authenticate via your World App wallet.
3. **Verify Identity**: Complete Self Protocol verification.
4. **Explore Dares**: Browse available dares or create a new one.
5. **Participate & Upload Proof**: Complete a dare and upload your photo/video proof to Filecoin WARM.
6. **Bet & Vote**: Participate in micro-betting and voting for other users’ dare submissions.
7. **Claim Rewards**: Receive PYUSD payouts based on dare outcomes and betting results.

## Resources & Links

* [Self Protocol Docs](https://docs.self.xyz/)
* [World App Mini App Docs](https://docs.world.org/mini-apps)
* [PYUSD Developer Resources](https://linktr.ee/pyusd_dev)
* [Filecoin WARM Storage Docs](https://filecoin.io/developers/warm-storage)
