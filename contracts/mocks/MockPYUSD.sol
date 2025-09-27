// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockPYUSD is ERC20 {
    constructor() ERC20("Mock PYUSD", "PYUSD") {
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}