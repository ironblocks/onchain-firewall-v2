// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {IFeePool} from "../interfaces/othentic/IFeePool.sol";
import {IProtocolRegistry} from "../interfaces/IProtocolRegistry.sol";

contract FeePool is IFeePool, AccessControlUpgradeable, UUPSUpgradeable {
    using Address for address payable;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant FEE_CLAIMER_ROLE = keccak256("FEE_CLAIMER_ROLE");
    bytes32 public constant FEE_WITHDRAWER_ROLE = keccak256("FEE_WITHDRAWER_ROLE");

    address public protocolRegistry;

    uint256 public collectedNativeFees;
    uint256 public collectedRescuedFees;

    mapping(address policy => uint256 fee) public policyFeeAmounts;
    mapping(address policy => uint256 balance) public policyBalance;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __FeePool_init(address _protocolRegistry) external initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        _setProtocolRegistry(_protocolRegistry);
    }

    function withdrawFees(
        address payable _recipient,
        uint256 _amount
    ) external onlyRole(FEE_WITHDRAWER_ROLE) {
        require(collectedNativeFees >= _amount, "FeePool: Insufficient balance.");

        collectedNativeFees -= _amount;

        _recipient.sendValue(_amount);

        emit FeesWithdrawn(_recipient, _amount);
    }

    function withdrawRescuedFees(
        address payable _recipient,
        uint256 _amount
    ) external onlyRole(FEE_WITHDRAWER_ROLE) {
        require(collectedRescuedFees >= _amount, "FeePool: Insufficient balance.");

        collectedRescuedFees -= _amount;

        _recipient.sendValue(_amount);

        emit RescuedFeesWithdrawn(_recipient, _amount);
    }

    function depositRescuedFees() external payable {
        collectedRescuedFees += msg.value;

        emit RescuedFeesDeposited(msg.value);
    }

    function depositNativeForPolicy(address _policy) external payable {
        policyBalance[_policy] += msg.value;

        emit NativeFeesDeposited(_policy, msg.value);
    }

    function claimNativeFeeFromPolicy(address _policy) external onlyRole(FEE_CLAIMER_ROLE) {
        uint256 protocolFee = _getProtocolFee(_policy);

        require(policyBalance[_policy] >= protocolFee, "FeePool: Insufficient balance.");

        policyBalance[_policy] -= protocolFee;
        collectedNativeFees += protocolFee;

        emit NativeFeeClaimed(_policy, protocolFee);
    }

    function setPolicyNativeFeeAmount(address _policy, uint256 _amount) external {
        require(msg.sender == protocolRegistry, "FeePool: Only protocol registry.");

        policyFeeAmounts[_policy] = _amount;

        emit PolicyNativeFeeAmountSet(_policy, _amount);
    }

    function setProtocolRegistry(address _protocolRegistry) external onlyRole(ADMIN_ROLE) {
        _setProtocolRegistry(_protocolRegistry);
    }

    function _setProtocolRegistry(address _protocolRegistry) internal {
        protocolRegistry = _protocolRegistry;

        emit ProtocolRegistrySet(_protocolRegistry);
    }

    function getRequiredNativeAmountForPolicy(address _policy) public view returns (uint256) {
        uint256 policyCurrentBalance = policyBalance[_policy];
        uint256 policyFeeAmount = _getProtocolFee(_policy);

        return policyFeeAmount > policyCurrentBalance ? policyFeeAmount - policyCurrentBalance : 0;
    }

    function getTotalRequiredNativeAmountForPolicies(
        address[] calldata _policies
    ) external view returns (uint256 totalRequiredAmount) {
        for (uint256 i = 0; i < _policies.length; i++) {
            totalRequiredAmount += getRequiredNativeAmountForPolicy(_policies[i]);
        }
    }

    function _getProtocolFee(address _policy) internal view returns (uint256) {
        return IProtocolRegistry(protocolRegistry).getProtocolFee(_policy);
    }

    function _authorizeUpgrade(address) internal view override onlyRole(ADMIN_ROLE) {}

    function version() external pure returns (uint256) {
        return 1;
    }
}
