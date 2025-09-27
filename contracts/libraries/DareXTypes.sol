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

        // +++ VOTING FIELDS ADDED +++
        uint256 forVotes;      // Votes for success
        uint256 againstVotes;  // Votes for failure
        uint256 participantCount;
    }
    
    struct Submission {
        address participant;
        string proofCID;
        uint256 submittedAt;
        bool exists;
    }
}