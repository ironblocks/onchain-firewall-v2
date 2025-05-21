// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

contract L2AvsTreasuryMock {
    event DepositERC20(uint256 amount);
    function depositERC20(uint256 _amount) external {
        emit DepositERC20(_amount);
    }
}
