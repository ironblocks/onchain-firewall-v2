// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {BeaconProxyVennFirewallConsumer} from "../../../consumers/presets/proxy/BeaconProxyVennFirewallConsumer.sol";

contract SampleVennBeaconConsumer is BeaconProxyVennFirewallConsumer, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using Address for address payable;

    mapping(address user => uint256 ethBalance) public deposits;
    mapping(address user => mapping(address token => uint256 tokenBalance)) public tokenDeposits;

    function initialize() external initializer {
        __Ownable_init();
    }

    function deposit() external payable firewallProtected {
        deposits[msg.sender] += _msgValue();
    }

    function withdraw(uint256 _amount) external firewallProtected {
        deposits[msg.sender] -= _amount;
        payable(msg.sender).sendValue(_amount);
    }

    function depositToken(address _token, uint256 _amount) external firewallProtected {
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        tokenDeposits[_token][msg.sender] += _amount;
    }

    function withdrawToken(address _token, uint256 _amount) external firewallProtected {
        tokenDeposits[_token][msg.sender] -= _amount;
        IERC20(_token).safeTransfer(msg.sender, _amount);
    }

    function setOwner(address _newOwner) external onlyOwner firewallProtected {
        _transferOwnership(_newOwner);
    }

    function version() external pure returns (uint256) {
        return 1;
    }
}
