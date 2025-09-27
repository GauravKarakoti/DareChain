// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IWorldID} from "../../src/interfaces/IWorldID.sol";

contract MockWorldID is IWorldID {
    mapping(uint256 => bool) public nullifierHashes;

    function verifyProof(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external {
        require(!nullifierHashes[nullifierHash], "Nullifier has already been used");
        nullifierHashes[nullifierHash] = true;
    }
}
