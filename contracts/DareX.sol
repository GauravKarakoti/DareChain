// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPYUSD.sol";
import "./interfaces/ISelfProtocol.sol";
import "./libraries/DareXTypes.sol";

contract DareX is ReentrancyGuard, Ownable {
    using DareXTypes for DareXTypes.Dare;
    
    IPYUSD public pyusdToken;
    ISelfProtocol public selfProtocol;
    
    uint256 public dareCount;
    uint256 public totalVolume;
    uint256 public platformFee = 50; // 0.5% in basis points (0.5%)
    address public treasury;
    
    mapping(uint256 => DareXTypes.Dare) public dares;
    mapping(uint256 => DareXTypes.Submission) public submissions;
    mapping(uint256 => mapping(address => DareXTypes.Bet)) public bets;
    mapping(uint256 => address[]) public dareBettors;
    mapping(address => uint256) public userReputation;
    mapping(address => uint256) public userCompletedDares;
    
    event DareCreated(
        uint256 indexed dareId,
        address indexed creator,
        uint256 reward,
        uint256 deadline
    );
    
    event DareSubmitted(
        uint256 indexed dareId,
        address indexed participant,
        string proofCID
    );
    
    event BetPlaced(
        uint256 indexed dareId,
        address indexed better,
        uint256 amount,
        bool vote
    );
    
    event DareCompleted(
        uint256 indexed dareId,
        address indexed winner,
        uint256 reward,
        bool success
    );
    
    event BetClaimed(
        uint256 indexed dareId,
        address indexed better,
        uint256 amount
    );
    
    modifier onlyVerified() {
        require(selfProtocol.verifyIdentity(msg.sender), "Identity not verified");
        _;
    }
    
    modifier dareExists(uint256 dareId) {
        require(dareId > 0 && dareId <= dareCount, "Dare does not exist");
        _;
    }
    
    modifier dareActive(uint256 dareId) {
        require(dares[dareId].deadline > block.timestamp, "Dare expired");
        require(!dares[dareId].completed, "Dare already completed");
        _;
    }
    
    constructor(address _pyusd, address _selfProtocol, address _treasury) {
        pyusdToken = IPYUSD(_pyusd);
        selfProtocol = ISelfProtocol(_selfProtocol);
        treasury = _treasury;
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
        require(_deadline <= block.timestamp + 30 days, "Deadline too far");
        
        // Transfer PYUSD from creator to contract
        require(
            pyusdToken.transferFrom(msg.sender, address(this), _reward),
            "PYUSD transfer failed"
        );
        
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
            totalBetAmount: 0,
            successBetAmount: 0,
            participantCount: 0
        });
        
        totalVolume += _reward;
        
        emit DareCreated(dareCount, msg.sender, _reward, _deadline);
    }
    
    function submitProof(
        uint256 _dareId,
        string memory _proofCID
    ) external dareExists(_dareId) dareActive(_dareId) onlyVerified {
        DareXTypes.Dare storage dare = dares[_dareId];
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
    
    function placeBet(
        uint256 _dareId,
        uint256 _amount,
        bool _vote
    ) external dareExists(_dareId) dareActive(_dareId) onlyVerified nonReentrant {
        require(_amount > 0, "Bet amount must be positive");
        require(submissions[_dareId].exists, "No submission to bet on");
        
        DareXTypes.Dare storage dare = dares[_dareId];
        require(msg.sender != dare.creator, "Creator cannot bet");
        require(msg.sender != submissions[_dareId].participant, "Participant cannot bet");
        
        // Check if user already bet
        require(bets[_dareId][msg.sender].amount == 0, "Already bet on this dare");
        
        // Transfer PYUSD from better to contract
        require(
            pyusdToken.transferFrom(msg.sender, address(this), _amount),
            "PYUSD transfer failed"
        );
        
        bets[_dareId][msg.sender] = DareXTypes.Bet({
            better: msg.sender,
            amount: _amount,
            vote: _vote,
            claimed: false
        });
        
        dareBettors[_dareId].push(msg.sender);
        dare.totalBetAmount += _amount;
        
        if (_vote) {
            dare.successBetAmount += _amount;
        }
        
        emit BetPlaced(_dareId, msg.sender, _amount, _vote);
    }
    
    function completeDare(
        uint256 _dareId,
        bool _success
    ) external dareExists(_dareId) nonReentrant {
        DareXTypes.Dare storage dare = dares[_dareId];
        require(!dare.completed, "Dare already completed");
        require(block.timestamp > dare.deadline, "Dare not expired yet");
        require(submissions[_dareId].exists, "No submission exists");
        
        dare.completed = true;
        
        address participant = submissions[_dareId].participant;
        uint256 platformFeeAmount = (dare.reward * platformFee) / 10000;
        uint256 creatorReward = dare.reward - platformFeeAmount;
        
        if (_success) {
            // Participant wins
            dare.winner = participant;
            
            // Transfer reward to participant (minus platform fee)
            require(
                pyusdToken.transfer(participant, creatorReward),
                "Reward transfer failed"
            );
            
            // Transfer platform fee to treasury
            if (platformFeeAmount > 0) {
                require(
                    pyusdToken.transfer(treasury, platformFeeAmount),
                    "Fee transfer failed"
                );
            }
            
            userReputation[participant] += 10;
            userCompletedDares[participant]++;
        } else {
            // Creator gets their money back (minus platform fee)
            require(
                pyusdToken.transfer(dare.creator, creatorReward),
                "Refund transfer failed"
            );
            
            if (platformFeeAmount > 0) {
                require(
                    pyusdToken.transfer(treasury, platformFeeAmount),
                    "Fee transfer failed"
                );
            }
        }
        
        emit DareCompleted(_dareId, dare.winner, dare.reward, _success);
    }
    
    function claimBetWinnings(uint256 _dareId) external dareExists(_dareId) nonReentrant {
        DareXTypes.Dare storage dare = dares[_dareId];
        require(dare.completed, "Dare not completed");
        
        DareXTypes.Bet storage bet = bets[_dareId][msg.sender];
        require(bet.amount > 0, "No bet placed");
        require(!bet.claimed, "Already claimed");
        
        bet.claimed = true;
        
        bool betWon = (dare.winner != address(0)) == bet.vote;
        
        if (betWon) {
            uint256 winningAmount = calculateWinnings(_dareId, msg.sender);
            require(
                pyusdToken.transfer(msg.sender, winningAmount),
                "Winnings transfer failed"
            );
            
            emit BetClaimed(_dareId, msg.sender, winningAmount);
        } else {
            emit BetClaimed(_dareId, msg.sender, 0);
        }
    }
    
    function calculateWinnings(uint256 _dareId, address _better) public view returns (uint256) {
        DareXTypes.Dare storage dare = dares[_dareId];
        DareXTypes.Bet storage bet = bets[_dareId][_better];
        
        if (!dare.completed || bet.amount == 0) return 0;
        
        bool betWon = (dare.winner != address(0)) == bet.vote;
        if (!betWon) return 0;
        
        uint256 totalWinningPool = bet.vote ? 
            (dare.totalBetAmount - dare.successBetAmount) : 
            dare.successBetAmount;
            
        uint256 totalLosingPool = bet.vote ? 
            dare.successBetAmount : 
            (dare.totalBetAmount - dare.successBetAmount);
        
        if (totalLosingPool == 0) return bet.amount; // No losers, return original bet
        
        uint256 winnings = bet.amount + (bet.amount * totalLosingPool) / totalWinningPool;
        return winnings;
    }
    
    // Admin functions
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 500, "Fee too high"); // Max 5%
        platformFee = _newFee;
    }
    
    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury");
        treasury = _newTreasury;
    }
    
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IPYUSD token = IPYUSD(_token);
        require(token.transfer(owner(), _amount), "Withdrawal failed");
    }
    
    // View functions
    function getDareBettors(uint256 _dareId) external view returns (address[] memory) {
        return dareBettors[_dareId];
    }
    
    function getUserBets(address _user) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= dareCount; i++) {
            if (bets[i][_user].amount > 0) {
                count++;
            }
        }
        
        uint256[] memory userDareIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= dareCount; i++) {
            if (bets[i][_user].amount > 0) {
                userDareIds[index] = i;
                index++;
            }
        }
        return userDareIds;
    }
    
    function getActiveDares() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= dareCount; i++) {
            if (!dares[i].completed && dares[i].deadline > block.timestamp) {
                count++;
            }
        }
        
        uint256[] memory activeDares = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= dareCount; i++) {
            if (!dares[i].completed && dares[i].deadline > block.timestamp) {
                activeDares[index] = i;
                index++;
            }
        }
        return activeDares;
    }
}