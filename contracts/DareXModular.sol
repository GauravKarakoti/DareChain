// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPYUSD.sol";
import "./interfaces/ISelfProtocol.sol";
import "./libraries/DareXTypes.sol";
import "./RewardDistribution.sol";
import "./Voting.sol"; // <-- Import Voting instead of BettingPool

contract DareXModular is ReentrancyGuard, Ownable {
    IPYUSD public pyusdToken;
    ISelfProtocol public selfProtocol;
    RewardDistribution public rewardDistribution;
    
    uint256 public dareCount;
    uint256 public totalVolume;
    
    mapping(uint256 => DareXTypes.Dare) public dares;
    mapping(uint256 => DareXTypes.Submission) public submissions;
    mapping(uint256 => address) public votingContracts; // <-- Renamed from bettingPools
    mapping(address => uint256) public userReputation;
    mapping(address => uint256) public userCompletedDares;
    
    event DareCreated(uint256 indexed dareId, address indexed creator, uint256 reward, uint256 deadline);
    event DareSubmitted(uint256 indexed dareId, address indexed participant, string proofCID);
    event DareCompleted(uint256 indexed dareId, address indexed winner, uint256 reward, bool success);
    event VotingContractCreated(uint256 indexed dareId, address votingContract); // <-- Renamed event
    
    modifier onlyVerified() {
        require(selfProtocol.verifyIdentity(msg.sender), "Identity not verified");
        _;
    }
    
    modifier dareExists(uint256 dareId) {
        require(dareId > 0 && dareId <= dareCount, "Dare does not exist");
        _;
    }
    
    constructor(address _pyusd, address _selfProtocol, address _treasury) {
        pyusdToken = IPYUSD(_pyusd);
        selfProtocol = ISelfProtocol(_selfProtocol);
        rewardDistribution = new RewardDistribution(_pyusd, _treasury);
        _transferOwnership(msg.sender);
    }
    
    function createDare(
        string memory _title,
        string memory _description,
        uint256 _reward,
        uint256 _deadline
    ) external onlyVerified nonReentrant {
        require(_reward > 0, "Reward must be positive");
        require(_deadline > block.timestamp, "Deadline must be in future");
        
        require(pyusdToken.transferFrom(msg.sender, address(rewardDistribution), _reward), "PYUSD transfer failed");
        
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
            participantCount: 0
        });
        
        // Create a voting contract for this dare
        Voting votingContract = new Voting(dareCount, _deadline, address(selfProtocol), address(this));
        votingContracts[dareCount] = address(votingContract);
        
        totalVolume += _reward;
        
        emit DareCreated(dareCount, msg.sender, _reward, _deadline);
        emit VotingContractCreated(dareCount, address(votingContract));
    }

    function submitProof(uint256 _dareId, string memory _proofCID) 
        external 
        dareExists(_dareId) 
        onlyVerified 
    {
        DareXTypes.Dare storage dare = dares[_dareId];
        require(block.timestamp <= dare.deadline, "Dare expired");
        require(!dare.completed, "Dare completed");
        require(!submissions[_dareId].exists, "Proof already submitted");
        require(msg.sender != dare.creator, "Creator cannot participate");
        
        submissions[_dareId] = DareXTypes.Submission({
            participant: msg.sender,
            proofCID: _proofCID,
            submittedAt: block.timestamp,
            exists: true
        });
        
        dare.participantCount++;
        
        emit DareSubmitted(_dareId, msg.sender, _proofCID);
    }
    
    // Note: _success parameter is removed. The outcome is now determined by the vote.
    function completeDare(uint256 _dareId) 
        external 
        dareExists(_dareId) 
        nonReentrant 
    {
        DareXTypes.Dare storage dare = dares[_dareId];
        require(!dare.completed, "Dare already completed");
        require(block.timestamp > dare.deadline, "Dare not expired");
        require(submissions[_dareId].exists, "No submission exists");
        
        // Get the result from the voting contract
        Voting votingContract = Voting(votingContracts[_dareId]);
        (bool wasSuccessful, uint256 _for, uint256 _against) = votingContract.getVoteResult();

        dare.completed = true;
        dare.forVotes = _for;
        dare.againstVotes = _against;
        
        address participant = submissions[_dareId].participant;
        
        if (wasSuccessful) {
            dare.winner = participant;
            userReputation[participant] += 10;
            userCompletedDares[participant]++;
        }
        
        // Let RewardDistribution handle the funds
        rewardDistribution.distributeDareRewards(
            dare.creator,
            participant,
            dare.reward,
            wasSuccessful
        );
        
        emit DareCompleted(_dareId, dare.winner, dare.reward, wasSuccessful);
    }
    
    function getVotingContract(uint256 _dareId) external view returns (address) {
        return votingContracts[_dareId];
    }
}