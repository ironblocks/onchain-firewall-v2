// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {IPolicyDeployer} from "../interfaces/policies/IPolicyDeployer.sol";
import {IFirewallModule} from "../interfaces/gnosis-safe/IFirewallModule.sol";
import {ITransientApprovedCallsPolicyFactory} from "../interfaces/policies/ITransientApprovedCallsPolicyFactory.sol";

contract PolicyDeployer is IPolicyDeployer, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address public firewallModule;

    mapping(address factory => bool isApproved) public approvedFactories;

    constructor(address _firewallModule) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        _setFirewallModule(_firewallModule);
    }

    function deployPolicies(
        address _firewall,
        address[] calldata _factories,
        bytes[] calldata _createData
    ) external returns (address[] memory policies) {
        require(_factories.length == _createData.length, "PolicyDeployer: Length mismatch.");

        policies = new address[](_factories.length);

        for (uint256 i = 0; i < _factories.length; i++) {
            address factory = _factories[i];

            require(approvedFactories[factory], "PolicyDeployer: Factory not approved.");

            address newPolicy = ITransientApprovedCallsPolicyFactory(factory).create(
                _createData[i]
            );
            IFirewallModule(firewallModule).approvePolicy(newPolicy, _firewall);

            policies[i] = newPolicy;

            emit PolicyCreated(factory, newPolicy);
        }
    }

    function setFactoryStatuses(
        address[] calldata _factories,
        bool[] calldata _statuses
    ) external onlyRole(ADMIN_ROLE) {
        require(_factories.length == _statuses.length, "PolicyDeployer: Length mismatch.");

        for (uint256 i = 0; i < _factories.length; i++) {
            approvedFactories[_factories[i]] = _statuses[i];

            emit FactoryStatusSet(_factories[i], _statuses[i]);
        }
    }

    function setFirewallModule(address _firewallModule) external onlyRole(ADMIN_ROLE) {
        _setFirewallModule(_firewallModule);
    }

    function _setFirewallModule(address _firewallModule) internal {
        firewallModule = _firewallModule;

        emit FirewallModuleSet(_firewallModule);
    }
}
