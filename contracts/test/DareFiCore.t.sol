// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {DareFiCore} from "../src/core/DareFiCore.sol";
import {MockWorldID} from "./mocks/MockWorldID.sol";

contract DareFiCoreTest is Test {
    DareFiCore public dareFiCore;
    MockWorldID public mockWorldID;
    
    address public creator = address(1);
    address public participant = address(2);
    
    function setUp() public {
        mockWorldID = new MockWorldID();
        dareFiCore = new DareFiCore(address(mockWorldID));
        
        // Give accounts some ETH
        vm.deal(creator, 10 ether);
        vm.deal(participant, 10 ether);
    }

    function testVerifyHuman() public {
        dareFiCore.verifyHuman(address(this), 0, 1, [uint256(0), 0, 0, 0, 0, 0, 0, 0]);
        assertTrue(dareFiCore.verifiedHumans(address(this)));
    }

    function testCreateDare() public {
        // Verify creator as human first
        vm.prank(creator);
        dareFiCore.verifyHuman(creator, 0, 1, [uint256(0), 0, 0, 0, 0, 0, 0, 0]);
        
        uint256 reward = 1 ether;
        uint256 deadline = block.timestamp + 1 days;
        
        vm.prank(creator);
        dareFiCore.createDare{value: reward}(
            "Test Dare",
            "This is a test dare",
            deadline
        );

        DareFiCore.Dare memory dare = dareFiCore.getDare(1);
        
        assertEq(dare.id, 1);
        assertEq(dare.creator, creator);
        assertEq(dare.title, "Test Dare");
        assertEq(dare.description, "This is a test dare");
        assertEq(dare.reward, reward);
        assertEq(dare.deadline, deadline);
        assertEq(uint8(dare.status), uint8(DareFiCore.DareStatus.ACTIVE));
        assertEq(dare.winner, address(0));
        assertEq(dare.rewardClaimed, false);
    }

    function testSubmitProof() public {
        // Setup: create a dare
        vm.prank(creator);
        dareFiCore.verifyHuman(creator, 0, 1, [uint256(0), 0, 0, 0, 0, 0, 0, 0]);
        
        vm.prank(creator);
        dareFiCore.createDare{value: 1 ether}(
            "Test Dare", 
            "Test description", 
            block.timestamp + 1 days
        );
        
        // Verify participant as human
        vm.prank(participant);
        dareFiCore.verifyHuman(participant, 0, 2, [uint256(0), 0, 0, 0, 0, 0, 0, 0]);
        
        // Submit proof
        vm.prank(participant);
        dareFiCore.submitProof(1, "I completed the dare!");
        
        // Check submission
        DareFiCore.Submission[] memory submissions = dareFiCore.getSubmissions(1);
        assertEq(submissions.length, 1);
        assertEq(submissions[0].submitter, participant);
        assertEq(submissions[0].proofText, "I completed the dare!");
        assertEq(submissions[0].approved, false);
    }

    function testApproveSubmissionAndClaimReward() public {
        // Setup: create dare and submit proof
        vm.prank(creator);
        dareFiCore.verifyHuman(creator, 0, 1, [uint256(0), 0, 0, 0, 0, 0, 0, 0]);
        
        vm.prank(participant);
        dareFiCore.verifyHuman(participant, 0, 2, [uint256(0), 0, 0, 0, 0, 0, 0, 0]);
        
        vm.prank(creator);
        dareFiCore.createDare{value: 1 ether}(
            "Test Dare", 
            "Test description", 
            block.timestamp + 1 days
        );
        
        vm.prank(participant);
        dareFiCore.submitProof(1, "I completed the dare!");
        
        // Creator approves submission
        vm.prank(creator);
        dareFiCore.approveSubmission(1, 0);
        
        // Check dare is completed and winner is set
        DareFiCore.Dare memory dare = dareFiCore.getDare(1);
        assertEq(uint8(dare.status), uint8(DareFiCore.DareStatus.COMPLETED));
        assertEq(dare.winner, participant);
        
        // Winner claims reward
        uint256 balanceBefore = participant.balance;
        vm.prank(participant);
        dareFiCore.claimReward(1);
        
        uint256 balanceAfter = participant.balance;
        assertEq(balanceAfter - balanceBefore, 1 ether);
        
        // Check reward is marked as claimed
        dare = dareFiCore.getDare(1);
        assertEq(dare.rewardClaimed, true);
    }

    function testCannotSubmitToExpiredDare() public {
        vm.prank(creator);
        dareFiCore.verifyHuman(creator, 0, 1, [uint256(0), 0, 0, 0, 0, 0, 0, 0]);
        
        vm.prank(participant);
        dareFiCore.verifyHuman(participant, 0, 2, [uint256(0), 0, 0, 0, 0, 0, 0, 0]);
        
        // Create dare that expires immediately
        vm.prank(creator);
        dareFiCore.createDare{value: 1 ether}(
            "Test Dare", 
            "Test description", 
            block.timestamp + 1
        );
        
        // Fast forward time past deadline
        vm.warp(block.timestamp + 2);
        
        // Try to submit proof - should fail
        vm.prank(participant);
        vm.expectRevert("Dare has expired");
        dareFiCore.submitProof(1, "Too late!");
    }

    function testCancelDare() public {
        vm.prank(creator);
        dareFiCore.verifyHuman(creator, 0, 1, [uint256(0), 0, 0, 0, 0, 0, 0, 0]);
        
        uint256 reward = 1 ether;
        vm.prank(creator);
        dareFiCore.createDare{value: reward}(
            "Test Dare", 
            "Test description", 
            block.timestamp + 1 days
        );
        
        uint256 balanceBefore = creator.balance;
        
        // Creator cancels dare
        vm.prank(creator);
        dareFiCore.cancelDare(1);
        
        uint256 balanceAfter = creator.balance;
        assertEq(balanceAfter - balanceBefore, reward);
        
        // Check dare status
        DareFiCore.Dare memory dare = dareFiCore.getDare(1);
        assertEq(uint8(dare.status), uint8(DareFiCore.DareStatus.COMPLETED));
        assertEq(dare.rewardClaimed, true);
    }
}