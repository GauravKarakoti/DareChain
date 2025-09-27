// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWorldID {
    function verifyProof(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external;
}
