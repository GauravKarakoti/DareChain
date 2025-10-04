// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./libraries/DareXTypes.sol";
import "./RewardDistribution.sol";
import "./Voting.sol";

contract DareXModular is ReentrancyGuard, Ownable {
    RewardDistribution public rewardDistribution;

    uint256 public dareCount;
    uint256 public totalVolume;

    mapping(uint256 => DareXTypes.Dare) public dares;
    // --- MAJOR CHANGE: From single submission to an array of submissions ---
    mapping(uint256 => DareXTypes.Submission[]) public submissions;
    // --- NEW: Track if a user has already submitted for a specific dare ---
    mapping(uint256 => mapping(address => bool)) public hasSubmitted;

    mapping(uint256 => address) public votingContracts;
    mapping(address => uint256) public userReputation;
    mapping(address => uint256) public userCompletedDares;

    event DareCreated(uint256 indexed dareId, address indexed creator, uint256 reward, uint256 deadline);
    event DareSubmitted(uint256 indexed dareId, address indexed participant, string proofCID);
    event DareCompleted(uint256 indexed dareId, address indexed winner, uint256 reward, bool success);
    event VotingContractCreated(uint256 indexed dareId, address votingContract);
    // --- NEW: Event for when the creator selects a winner ---
    event WinnerSelected(uint256 indexed dareId, address indexed winner);

    modifier dareExists(uint256 dareId) {
        require(dareId > 0 && dareId <= dareCount, "Dare does not exist");
        _;
    }

    constructor(address _treasury) {
        rewardDistribution = new RewardDistribution(_treasury);
        _transferOwnership(msg.sender);
    }

    function createDare(
        string memory _title,
        string memory _description,
        uint256 _reward,
        uint256 _deadline
    ) external nonReentrant payable {
        require(_reward > 0, "Reward must be positive");
        require(msg.value == _reward, "Must send exact reward amount");
        require(_deadline > block.timestamp, "Deadline must be in future");

        dareCount++;

        dares[dareCount] = DareXTypes.Dare({
            id: dareCount,
            creator: msg.sender,
            title: _title,
            description: _description,
            reward: _reward,
            deadline: _deadline,
            createdAt: block.timestamp,
            completed: false,
            winner: address(0),
            proofCID: "",
            forVotes: 0,
            againstVotes: 0,
            participantCount: 0,
            winnerSelected: false // Initialize new flag
        });

        // The voting contract is now for the *entire dare*, not a single submission
        Voting votingContract = new Voting(dareCount, _deadline, address(this));
        votingContracts[dareCount] = address(votingContract);

        totalVolume += _reward;

        emit DareCreated(dareCount, msg.sender, _reward, _deadline);
        emit VotingContractCreated(dareCount, address(votingContract));
    }

    // --- UPDATED: Allows multiple submissions ---
    function submitProof(uint256 _dareId, string memory _proofCID)
        external
        dareExists(_dareId)
    {
        DareXTypes.Dare storage dare = dares[_dareId];
        require(block.timestamp <= dare.deadline, "Dare expired");
        require(!dare.completed, "Dare completed");
        // --- NEW: Check if this specific user has already submitted ---
        require(!hasSubmitted[_dareId][msg.sender], "You have already submitted proof");

        submissions[_dareId].push(DareXTypes.Submission({
            participant: msg.sender,
            proofCID: _proofCID,
            submittedAt: block.timestamp
        }));
        
        hasSubmitted[_dareId][msg.sender] = true;
        dare.participantCount++;

        emit DareSubmitted(_dareId, msg.sender, _proofCID);
    }

    // --- NEW FUNCTION: To be called by the dare creator ---
    function selectWinner(uint256 _dareId, address _winner)
        external
        dareExists(_dareId)
    {
        DareXTypes.Dare storage dare = dares[_dareId];
        require(msg.sender == dare.creator, "Only creator can select winner");
        require(block.timestamp > dare.deadline, "Dare has not expired yet");
        require(!dare.winnerSelected, "Winner already selected");

        // Verify the selected winner actually submitted a proof
        bool winnerIsValid = false;
        for (uint i = 0; i < submissions[_dareId].length; i++) {
            if (submissions[_dareId][i].participant == _winner) {
                winnerIsValid = true;
                break;
            }
        }
        require(winnerIsValid, "Selected winner did not submit proof");

        dare.winner = _winner;
        dare.winnerSelected = true;
        emit WinnerSelected(_dareId, _winner);
    }


    // --- REPLACED `completeDare` ---
    // This function is now called after a winner is selected and voting is done.
    function triggerRewardDistribution(uint256 _dareId)
        external
        dareExists(_dareId)
        nonReentrant
    {
        DareXTypes.Dare storage dare = dares[_dareId];
        require(!dare.completed, "Dare already completed");
        require(dare.winnerSelected, "Winner has not been selected yet");
        require(dare.winner != address(0), "Winner address is not set");

        // Get the result from the voting contract
        Voting votingContract = Voting(votingContracts[_dareId]);
        (bool wasSuccessful, uint256 _for, uint256 _against) = votingContract.getVoteResult();

        dare.completed = true;
        dare.forVotes = _for;
        dare.againstVotes = _against;

        address participant = dare.winner;

        if (wasSuccessful) {
            userReputation[participant] += 10;
            userCompletedDares[participant]++;
        }

        rewardDistribution.distributeDareRewards(
            dare.creator,
            participant,
            dare.reward,
            wasSuccessful
        );

        emit DareCompleted(_dareId, dare.winner, dare.reward, wasSuccessful);
    }
    
    // --- NEW HELPER FUNCTION: To fetch all submissions for a dare ---
    function getSubmissions(uint256 _dareId) 
        external 
        view 
        dareExists(_dareId) 
        returns (DareXTypes.Submission[] memory) 
    {
        return submissions[_dareId];
    }

    function getVotingContract(uint256 _dareId) external view returns (address) {
        return votingContracts[_dareId];
    }
}
