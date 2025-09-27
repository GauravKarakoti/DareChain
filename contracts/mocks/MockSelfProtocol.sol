// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockSelfProtocol {
    mapping(address => bool) public verifiedUsers;
    mapping(address => uint256) public identityScores;
    
    function setVerified(address user, bool status) external {
        verifiedUsers[user] = status;
    }
    
    function setIdentityScore(address user, uint256 score) external {
        identityScores[user] = score;
    }
    
    function verifyIdentity(address user) external view returns (bool) {
        return verifiedUsers[user];
    }
    
    function getIdentityScore(address user) external view returns (uint256) {
        return identityScores[user];
    }
}