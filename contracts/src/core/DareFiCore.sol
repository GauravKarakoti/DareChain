// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {WorldIDVerification} from "./WorldIDVerification.sol";

contract DareFiCore is ReentrancyGuard, WorldIDVerification {
    address public owner;

    constructor(address _worldIdAddress) WorldIDVerification(_worldIdAddress) {
        owner = msg.sender;
    }

    enum DareStatus {
        ACTIVE,
        COMPLETED
    }

    struct Dare {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 reward; // ETH amount in wei
        uint256 deadline;
        DareStatus status;
        address winner;
        bool rewardClaimed;
    }

    struct Submission {
        uint256 id;
        uint256 dareId;
        address submitter;
        string proofText; // Simple text proof
        uint256 submittedAt;
        bool approved;
    }

    // State Variables
    uint256 public dareCounter;
    mapping(uint256 => Dare) public dares;
    mapping(uint256 => Submission[]) public submissions;

    // Events
    event DareCreated(uint256 indexed dareId, address indexed creator, uint256 reward);
    event SubmissionCreated(uint256 indexed submissionId, uint256 indexed dareId, address indexed submitter);
    event SubmissionApproved(uint256 indexed dareId, uint256 indexed submissionId, address indexed winner);
    event RewardClaimed(uint256 indexed dareId, address indexed winner, uint256 amount);

    // Modifier to check if a dare is active
    modifier isDareActive(uint256 _dareId) {
        require(dares[_dareId].status == DareStatus.ACTIVE, "Dare is not active");
        require(block.timestamp < dares[_dareId].deadline, "Dare has expired");
        _;
    }

    // Function to create a new dare (with ETH deposit)
    function createDare(
        string memory _title,
        string memory _description,
        uint256 _deadline
    ) external payable nonReentrant onlyVerifiedHuman {
        require(msg.value > 0, "Must deposit ETH as reward");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        dareCounter++;
        dares[dareCounter] = Dare({
            id: dareCounter,
            creator: msg.sender,
            title: _title,
            description: _description,
            reward: msg.value,
            deadline: _deadline,
            status: DareStatus.ACTIVE,
            winner: address(0),
            rewardClaimed: false
        });
        
        emit DareCreated(dareCounter, msg.sender, msg.value);
    }

    // Function to submit proof for a dare
    function submitProof(uint256 _dareId, string memory _proofText) external nonReentrant isDareActive(_dareId) onlyVerifiedHuman {
        Submission memory newSubmission = Submission({
            id: submissions[_dareId].length,
            dareId: _dareId,
            submitter: msg.sender,
            proofText: _proofText,
            submittedAt: block.timestamp,
            approved: false
        });
        
        submissions[_dareId].push(newSubmission);
        emit SubmissionCreated(newSubmission.id, _dareId, msg.sender);
    }

    // Function for dare creator to approve a submission and select winner
    function approveSubmission(uint256 _dareId, uint256 _submissionId) external nonReentrant {
        require(msg.sender == dares[_dareId].creator, "Only creator can approve");
        require(dares[_dareId].status == DareStatus.ACTIVE, "Dare is not active");
        require(_submissionId < submissions[_dareId].length, "Invalid submission ID");
        
        // Mark submission as approved
        submissions[_dareId][_submissionId].approved = true;
        
        // Set winner and complete dare
        dares[_dareId].winner = submissions[_dareId][_submissionId].submitter;
        dares[_dareId].status = DareStatus.COMPLETED;
        
        emit SubmissionApproved(_dareId, _submissionId, submissions[_dareId][_submissionId].submitter);
    }

    // Function for winner to claim reward
    function claimReward(uint256 _dareId) external nonReentrant {
        Dare storage dare = dares[_dareId];
        require(dare.status == DareStatus.COMPLETED, "Dare not completed");
        require(msg.sender == dare.winner, "You are not the winner");
        require(!dare.rewardClaimed, "Reward already claimed");
        
        dare.rewardClaimed = true;
        
        // Transfer ETH reward to winner
        (bool success, ) = payable(msg.sender).call{value: dare.reward}("");
        require(success, "Transfer failed");
        
        emit RewardClaimed(_dareId, msg.sender, dare.reward);
    }

    // View function to get all submissions for a dare
    function getSubmissions(uint256 _dareId) external view returns (Submission[] memory) {
        return submissions[_dareId];
    }

    // View function to get dare details
    function getDare(uint256 _dareId) external view returns (Dare memory) {
        return dares[_dareId];
    }

    // Emergency function for creator to cancel dare and get refund (only if no approved submissions)
    function cancelDare(uint256 _dareId) external nonReentrant {
        Dare storage dare = dares[_dareId];
        require(msg.sender == dare.creator, "Only creator can cancel");
        require(dare.status == DareStatus.ACTIVE, "Dare not active");
        require(dare.winner == address(0), "Cannot cancel dare with winner");
        
        dare.status = DareStatus.COMPLETED; // Prevent further submissions
        dare.rewardClaimed = true; // Prevent reward claiming
        
        // Refund the creator
        (bool success, ) = payable(msg.sender).call{value: dare.reward}("");
        require(success, "Refund failed");
    }
}
