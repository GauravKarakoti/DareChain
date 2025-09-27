// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DareChain {
    struct Dare {
        uint256 id;
        address creator;
        string description;
        uint256 reward;
        uint256 deadline;
        bool completed;
        address winner;
    }
    
    mapping(uint256 => Dare) public dares;
    uint256 public dareCount;
    
    event DareCreated(uint256 indexed dareId, address creator, uint256 reward);
    event DareCompleted(uint256 indexed dareId, address winner);
    
    function createDare(string memory _description, uint256 _deadline) external payable {
        dareCount++;
        dares[dareCount] = Dare({
            id: dareCount,
            creator: msg.sender,
            description: _description,
            reward: msg.value,
            deadline: _deadline,
            completed: false,
            winner: address(0)
        });
        
        emit DareCreated(dareCount, msg.sender, msg.value);
    }
}