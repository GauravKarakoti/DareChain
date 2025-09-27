// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ISelfProtocol {
    function verifyIdentity(address user) external view returns (bool);
    function getIdentityScore(address user) external view returns (uint256);
}