// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IWorldID} from "../interfaces/IWorldID.sol";

contract WorldIDVerification {
    IWorldID internal worldId;
    uint256 internal groupId = 1;

    mapping(uint256 => bool) public nullifierHashes;
    mapping(address => bool) public verifiedHumans;

    modifier onlyVerifiedHuman() {
        require(verifiedHumans[msg.sender], "Must be a verified human");
        _;
    }

    constructor(address _worldIdAddress) {
        worldId = IWorldID(_worldIdAddress);
    }

    function verifyHuman(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external {
        require(!nullifierHashes[nullifierHash], "Nullifier has already been used");
        worldId.verifyProof(signal, root, nullifierHash, proof);
        nullifierHashes[nullifierHash] = true;
        verifiedHumans[msg.sender] = true;
    }
}
