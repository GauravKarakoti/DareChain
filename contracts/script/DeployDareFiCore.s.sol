// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {DareFiCore} from "../src/core/DareFiCore.sol";

contract DeployDareFiCore is Script {
    function run() external returns (DareFiCore) {
        // World ID contract address on World Chain Sepolia
        address worldIdAddress = vm.envOr("WORLD_ID_ADDRESS", address(0x11cA3127182f7583EfC416a8771BD4d11Fae4334));
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("Deploying DareFiCore...");
        console.log("World ID Address:", worldIdAddress);
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        
        vm.startBroadcast(deployerPrivateKey);
        
        DareFiCore dareFiCore = new DareFiCore(worldIdAddress);
        
        vm.stopBroadcast();
        
        console.log("DareFiCore deployed at:", address(dareFiCore));
        console.log("Owner:", dareFiCore.owner());
        console.log("Current dare counter:", dareFiCore.dareCounter());
        
        return dareFiCore;
    }
}
