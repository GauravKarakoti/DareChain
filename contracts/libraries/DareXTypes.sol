// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library DareXTypes {
    struct Dare {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 reward;
        uint256 deadline;
        uint256 createdAt;
        bool completed;
        address winner;
        string proofCID; // Filecoin CID for proof
        uint256 totalBetAmount;
        uint256 successBetAmount;
        uint256 participantCount;
    }
    
    struct Bet {
        address better;
        uint256 amount;
        bool vote; // true = success, false = fail
        bool claimed;
    }
    
    struct Submission {
        address participant;
        string proofCID;
        uint256 submittedAt;
        bool exists;
    }
}