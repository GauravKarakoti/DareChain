// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPYUSD.sol";

contract RewardDistribution is ReentrancyGuard, Ownable {
    IPYUSD public pyusdToken;
    
    uint256 public platformFeeBps = 50; // 0.5% in basis points
    address public treasury;
    
    event RewardsDistributed(
        address indexed winner,
        uint256 participantReward,
        uint256 platformFee
    );
    
    constructor(address _pyusd, address _treasury) {
        pyusdToken = IPYUSD(_pyusd);
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
        
        // Transfer the net reward to the winner (participant) or back to creator
        require(pyusdToken.transfer(receiver, netReward), "Reward transfer failed");
        
        // Transfer the platform fee to the treasury
        if (platformFeeAmount > 0) {
            require(pyusdToken.transfer(treasury, platformFeeAmount), "Fee transfer failed");
        }
        
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

    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(pyusdToken.transfer(owner(), _amount), "Withdrawal failed");
    }
}