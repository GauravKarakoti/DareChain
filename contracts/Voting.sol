// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISelfProtocol.sol"; // Assuming voters also need to be verified

contract Voting is Ownable {
    uint256 public immutable dareId;
    uint256 public immutable deadline;
    ISelfProtocol public selfProtocol;

    uint256 public forVotes;
    uint256 public againstVotes;

    mapping(address => bool) public hasVoted;

    event Voted(address indexed voter, bool vote);

    modifier onlyActive() {
        require(block.timestamp <= deadline, "Voting period has ended");
        _;
    }

    modifier onlyVerified() {
        require(selfProtocol.verifyIdentity(msg.sender), "Identity not verified");
        _;
    }

    constructor(uint256 _dareId, uint256 _deadline, address _selfProtocol, address _owner) {
        dareId = _dareId;
        deadline = _deadline;
        selfProtocol = ISelfProtocol(_selfProtocol);
        _transferOwnership(_owner); // The darex contract owns this contract
    }

    function vote(bool _supports) external onlyActive onlyVerified {
        require(!hasVoted[msg.sender], "You have already voted");

        hasVoted[msg.sender] = true;

        if (_supports) {
            forVotes++;
        } else {
            againstVotes++;
        }

        emit Voted(msg.sender, _supports);
    }

    function getVoteResult() external view returns (bool success, uint256 _for, uint256 _against) {
        require(block.timestamp > deadline, "Voting still active");
        return (forVotes > againstVotes, forVotes, againstVotes);
    }
}