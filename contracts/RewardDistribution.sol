// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardDistribution is ReentrancyGuard, Ownable {
    
    uint256 public platformFeeBps = 50; // 0.5% in basis points
    address public treasury;
    
    event RewardsDistributed(
        address indexed winner,
        uint256 participantReward,
        uint256 platformFee
    );
    
    constructor(address _treasury) {
        treasury = _treasury;
        _transferOwnership(msg.sender); // The darex contract will own this.
    }
    
    function distributeDareRewards(
        address _creator,
        address _participant,
        uint256 _reward,
        bool _success
    ) external onlyOwner nonReentrant {
        uint256 platformFeeAmount = (_reward * platformFeeBps) / 10000;
        uint256 netReward = _reward - platformFeeAmount;
        
        address receiver = _success ? _participant : _creator;
        
        // Emit event for reward distribution (actual transfers handled externally)
        emit RewardsDistributed(receiver, netReward, platformFeeAmount);
    }
    
    // Admin functions
    function setPlatformFee(uint256 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= 500, "Fee too high"); // Max 5%
        platformFeeBps = _newFeeBps;
    }
    
    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury");
        treasury = _newTreasury;
    }
}