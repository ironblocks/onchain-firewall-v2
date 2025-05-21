// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IGnosisSafe} from "../dependencies/gnosis-safe/IGnosisSafe.sol";

import {IFirewall} from "../interfaces/IFirewall.sol";
import {IFirewallModule} from "../interfaces/gnosis-safe/IFirewallModule.sol";

contract FirewallModule is IFirewallModule {
    bytes4 private constant SET_POLICY_STATUS_SELECTOR = IFirewall.setPolicyStatus.selector;

    address public gnosisSafe;

    mapping(address deployer => bool isApproved) public approvedDeployers;
    mapping(address firewall => bool isApproved) public approvedFirewalls;

    constructor(address _gnosisSafe) {
        gnosisSafe = _gnosisSafe;
    }

    modifier onlySafe() {
        _onlySafe(msg.sender);
        _;
    }

    function approvePolicy(address _policy, address _firewall) external {
        require(approvedDeployers[msg.sender], "FirewallModule: Not approved deployer.");
        require(approvedFirewalls[_firewall], "FirewallModule: Not approved firewall.");

        bytes memory data = abi.encodeWithSelector(SET_POLICY_STATUS_SELECTOR, _policy, true);
        require(
            IGnosisSafe(gnosisSafe).execTransactionFromModule(
                _firewall,
                0,
                data,
                IGnosisSafe.Operation.Call
            ),
            "FirewallModule: Could not execute."
        );
    }

    function setDeployersStatus(address[] calldata _deployers, bool _status) external onlySafe {
        for (uint256 i = 0; i < _deployers.length; i++) {
            approvedDeployers[_deployers[i]] = _status;

            emit DeployerStatusSet(_deployers[i], _status);
        }
    }

    function setFirewallsStatus(address[] calldata _firewalls, bool _status) external onlySafe {
        for (uint256 i = 0; i < _firewalls.length; i++) {
            approvedFirewalls[_firewalls[i]] = _status;

            emit FirewallStatusSet(_firewalls[i], _status);
        }
    }

    function _onlySafe(address _sender) internal view {
        require(_sender == gnosisSafe, "FirewallModule: Only gnosis safe.");
    }
}
