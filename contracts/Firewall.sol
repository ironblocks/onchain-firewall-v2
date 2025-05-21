// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import {IFirewall} from "./interfaces/IFirewall.sol";
import {IFirewallPolicy} from "./interfaces/policies/IFirewallPolicy.sol";
import {IFirewallConsumer} from "./interfaces/consumers/IFirewallConsumer.sol";

/**
 * @title Firewall
 * @author David Benchimol @ Ironblocks
 * @dev This contract provides an open marketplace of firewall policies that can be subscribed to by consumers.
 *
 * Each policy is a contract that must implement the IFirewallPolicy interface. The policy contract is responsible for
 * making the decision on whether or not to allow a call to be executed. The policy contract gets access to the consumers
 * full context, including the sender, data, and value of the call as well as the ability to read state before and after
 * function execution.
 *
 * Each consumer is a contract whose policies are managed by a single admin. The admin is responsible for adding and removing
 * policies.
 */
contract Firewall is IFirewall, Ownable2StepUpgradeable, UUPSUpgradeable {
    mapping(address policy => bool isApproved) public approvedPolicies;
    mapping(address consumer => bool dryrun) public dryrunEnabled;

    // Mapping of consumer + sighash to array of policy addresses
    mapping(address consumer => mapping(bytes4 sighash => address[] policies))
        public subscribedPolicies;
    // Mapping of consumer to array of policy addresses applied to all consumer methods
    mapping(address consumer => address[] globalPolicies) public subscribedGlobalPolicies;

    /**
     * @dev Modifier to check if the caller is the consumer admin.
     * @param _consumer The address of the consumer contract.
     */
    modifier onlyConsumerAdmin(address _consumer) {
        _onlyConsumerAdmin(_consumer);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __Firewall_init() external initializer {
        __Ownable2Step_init();
    }

    function preExecution(address _sender, bytes calldata _data, uint256 _value) external {
        bytes4 selector = _extractSelector(_data);

        address[] memory policies = subscribedPolicies[msg.sender][selector];
        address[] memory globalPolicies = subscribedGlobalPolicies[msg.sender];

        if (dryrunEnabled[msg.sender]) {
            for (uint256 i = 0; i < policies.length; i++) {
                try IFirewallPolicy(policies[i]).preExecution(msg.sender, _sender, _data, _value) {
                    emit DryrunPolicyPreSuccess(msg.sender, selector, policies[i]);
                } catch (bytes memory err) {
                    emit DryrunPolicyPreError(msg.sender, selector, policies[i], err);
                }
            }
            for (uint256 i = 0; i < globalPolicies.length; i++) {
                try
                    IFirewallPolicy(globalPolicies[i]).preExecution(
                        msg.sender,
                        _sender,
                        _data,
                        _value
                    )
                {
                    emit GlobalDryrunPolicyPreSuccess(msg.sender, globalPolicies[i]);
                } catch (bytes memory err) {
                    emit GlobalDryrunPolicyPreError(msg.sender, globalPolicies[i], err);
                }
            }
        } else {
            for (uint256 i = 0; i < policies.length; i++) {
                IFirewallPolicy(policies[i]).preExecution(msg.sender, _sender, _data, _value);
                emit PolicyPreSuccess(msg.sender, selector, policies[i]);
            }
            for (uint256 i = 0; i < globalPolicies.length; i++) {
                IFirewallPolicy(globalPolicies[i]).preExecution(
                    msg.sender,
                    _sender,
                    _data,
                    _value
                );
                emit GlobalPolicyPreSuccess(msg.sender, globalPolicies[i]);
            }
        }
    }

    function postExecution(address _sender, bytes calldata _data, uint256 _value) external {
        bytes4 selector = _extractSelector(_data);

        address[] memory policies = subscribedPolicies[msg.sender][selector];
        address[] memory globalPolicies = subscribedGlobalPolicies[msg.sender];

        if (dryrunEnabled[msg.sender]) {
            for (uint256 i = 0; i < policies.length; i++) {
                try
                    IFirewallPolicy(policies[i]).postExecution(msg.sender, _sender, _data, _value)
                {
                    emit DryrunPolicyPostSuccess(msg.sender, selector, policies[i]);
                } catch (bytes memory err) {
                    emit DryrunPolicyPostError(msg.sender, selector, policies[i], err);
                }
            }
            for (uint256 i = 0; i < globalPolicies.length; i++) {
                try
                    IFirewallPolicy(globalPolicies[i]).postExecution(
                        msg.sender,
                        _sender,
                        _data,
                        _value
                    )
                {
                    emit GlobalDryrunPolicyPostSuccess(msg.sender, globalPolicies[i]);
                } catch (bytes memory err) {
                    emit GlobalDryrunPolicyPostError(msg.sender, globalPolicies[i], err);
                }
            }
        } else {
            for (uint256 i = 0; i < policies.length; i++) {
                IFirewallPolicy(policies[i]).postExecution(msg.sender, _sender, _data, _value);
                emit PolicyPostSuccess(msg.sender, selector, policies[i]);
            }
            for (uint256 i = 0; i < globalPolicies.length; i++) {
                IFirewallPolicy(globalPolicies[i]).postExecution(
                    msg.sender,
                    _sender,
                    _data,
                    _value
                );
                emit GlobalPolicyPostSuccess(msg.sender, globalPolicies[i]);
            }
        }
    }

    function setPolicyStatus(address _policy, bool _status) external onlyOwner {
        approvedPolicies[_policy] = _status;

        emit PolicyStatusUpdate(_policy, _status);
    }

    function setConsumerDryrunStatus(
        address _consumer,
        bool _status
    ) external onlyConsumerAdmin(_consumer) {
        dryrunEnabled[_consumer] = _status;

        emit ConsumerDryrunStatusUpdate(_consumer, _status);
    }

    function addGlobalPolicy(
        address _consumer,
        address _policy
    ) external onlyConsumerAdmin(_consumer) {
        _addGlobalPolicy(_consumer, _policy);
    }

    function removeGlobalPolicy(
        address _consumer,
        address _policy
    ) external onlyConsumerAdmin(_consumer) {
        _removeGlobalPolicy(_consumer, _policy);
    }

    function addGlobalPolicyForConsumers(address[] calldata _consumers, address _policy) external {
        for (uint256 i = 0; i < _consumers.length; i++) {
            _onlyConsumerAdmin(_consumers[i]);

            _addGlobalPolicy(_consumers[i], _policy);
        }
    }

    function removeGlobalPolicyForConsumers(
        address[] calldata _consumers,
        address _policy
    ) external {
        for (uint256 i = 0; i < _consumers.length; i++) {
            _onlyConsumerAdmin(_consumers[i]);

            _removeGlobalPolicy(_consumers[i], _policy);
        }
    }

    function addPolicies(
        address _consumer,
        bytes4[] calldata _methodSigs,
        address[] calldata _policies
    ) external onlyConsumerAdmin(_consumer) {
        require(
            _methodSigs.length == _policies.length,
            "Firewall: Method sigs and policies length mismatch."
        );

        for (uint256 i = 0; i < _policies.length; i++) {
            _addPolicy(_consumer, _methodSigs[i], _policies[i]);
        }
    }

    function addPolicy(
        address _consumer,
        bytes4 _methodSig,
        address _policy
    ) external onlyConsumerAdmin(_consumer) {
        _addPolicy(_consumer, _methodSig, _policy);
    }

    function removePolicies(
        address _consumer,
        bytes4[] calldata _methodSigs,
        address[] calldata _policies
    ) external onlyConsumerAdmin(_consumer) {
        require(
            _methodSigs.length == _policies.length,
            "Firewall: Method sigs and policies length mismatch."
        );

        for (uint256 i = 0; i < _policies.length; i++) {
            _removePolicy(_consumer, _methodSigs[i], _policies[i]);
        }
    }

    function removePolicy(
        address _consumer,
        bytes4 _methodSig,
        address _policy
    ) external onlyConsumerAdmin(_consumer) {
        _removePolicy(_consumer, _methodSig, _policy);
    }

    /**
     * @dev Internal function for adding a policy to a consumer.
     * @param _consumer The address of the consumer contract.
     * @param _methodSig The method signature of the consumer contract to which the policy applies.
     * @param _policy The address of the policy contract.
     */
    function _addPolicy(address _consumer, bytes4 _methodSig, address _policy) internal {
        _onlyApprovedPolicy(_policy);

        _verifyPolicyNotExists(subscribedPolicies[_consumer][_methodSig], _policy);

        subscribedPolicies[_consumer][_methodSig].push(_policy);

        emit PolicyAdded(_consumer, _methodSig, _policy);
    }

    /**
     * @dev Internal function for removing a policy from a consumer.
     * @param _consumer The address of the consumer contract.
     * @param _methodSig The method signature of the consumer contract to which the policy applies.
     * @param _policy The address of the policy contract.
     */
    function _removePolicy(address _consumer, bytes4 _methodSig, address _policy) internal {
        _removePolicyFromArray(subscribedPolicies[_consumer][_methodSig], _policy);

        emit PolicyRemoved(_consumer, _methodSig, _policy);
    }

    /**
     * @dev Internal function for adding a global policy to a consumer.
     * @param _consumer The address of the consumer contract.
     * @param _policy The address of the policy contract.
     */
    function _addGlobalPolicy(address _consumer, address _policy) internal {
        _onlyApprovedPolicy(_policy);

        _verifyPolicyNotExists(subscribedGlobalPolicies[_consumer], _policy);

        subscribedGlobalPolicies[_consumer].push(_policy);

        emit GlobalPolicyAdded(_consumer, _policy);
    }

    /**
     * @dev Internal function for removing a global policy from a consumer.
     * @param _consumer The address of the consumer contract.
     * @param _policy The address of the policy contract.
     */
    function _removeGlobalPolicy(address _consumer, address _policy) internal {
        _removePolicyFromArray(subscribedGlobalPolicies[_consumer], _policy);

        emit GlobalPolicyRemoved(_consumer, _policy);
    }

    function _verifyPolicyNotExists(address[] memory _policies, address _policy) internal pure {
        for (uint256 i = 0; i < _policies.length; i++) {
            require(_policies[i] != _policy, "Firewall: Policy already exists.");
        }
    }

    function _removePolicyFromArray(address[] storage _policies, address _policy) internal {
        for (uint256 i = 0; i < _policies.length; i++) {
            if (_policies[i] == _policy) {
                _policies[i] = _policies[_policies.length - 1];
                _policies.pop();

                return;
            }
        }

        revert("Firewall: Policy not found.");
    }

    function _onlyApprovedPolicy(address _policy) internal view {
        require(approvedPolicies[_policy], "Firewall: Policy not approved.");
    }

    function _onlyConsumerAdmin(address _consumer) internal view {
        require(
            msg.sender == IFirewallConsumer(_consumer).firewallAdmin(),
            "Firewall: Not consumer admin."
        );
    }

    function _extractSelector(bytes calldata _data) internal pure returns (bytes4) {
        return bytes4(_data);
    }

    function _authorizeUpgrade(address) internal view override onlyOwner {}

    function version() external pure returns (uint256) {
        return 1;
    }
}
