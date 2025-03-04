// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ERC4626Upgradeable, IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";

import {IVennVaultL2} from "../interfaces/othentic/IVennVaultL2.sol";

import {IAvsTreasury} from "../dependencies/othentic/interfaces/IAvsTreasury.sol";
import {IAttestationCenter} from "../dependencies/othentic/interfaces/IAttestationCenter.sol";

contract VennVaultL2 is
    IVennVaultL2,
    AccessControlUpgradeable,
    ERC4626Upgradeable,
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address public attestationCenter;
    address public l2AvsTreasury;

    bool public allowOperatorClaim;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __VennVaultL2_init(
        IERC20Upgradeable _asset,
        address _attestationCenter,
        address _l2AvsTreasury,
        bool _allowOperatorClaim
    ) external initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        __ERC4626_init(_asset);
        __ERC20_init("Venn Vault", "VVAULT");

        _setAttestationCenter(_attestationCenter);
        _setL2AvsTreasury(_l2AvsTreasury);
        _setAllowOperatorClaim(_allowOperatorClaim);
    }

    function ownerMint(address _to, uint256 _amount) external onlyRole(ADMIN_ROLE) {
        _mint(_to, _amount);
    }

    function beforePaymentRequest(
        uint256,
        IAttestationCenter.PaymentDetails calldata _paymentDetails,
        uint32
    ) external {
        require(allowOperatorClaim, "VennVaultL2: Operator claim is not allowed.");
        require(
            msg.sender == attestationCenter,
            "VennVaultL2: Only attestation center can call this function."
        );
        uint256 requiredAmount = _calculateRequiredAmount(_paymentDetails.feeToClaim);

        _mint(address(this), requiredAmount);
        _approve(address(this), l2AvsTreasury, requiredAmount);

        IAvsTreasury(l2AvsTreasury).depositERC20(requiredAmount);
    }

    function setAllowOperatorClaim(bool _allowOperatorClaim) external onlyRole(ADMIN_ROLE) {
        _setAllowOperatorClaim(_allowOperatorClaim);
    }

    function setAttestationCenter(address _attestationCenter) external onlyRole(ADMIN_ROLE) {
        _setAttestationCenter(_attestationCenter);
    }

    function setL2AvsTreasury(address _l2AvsTreasury) external onlyRole(ADMIN_ROLE) {
        _setL2AvsTreasury(_l2AvsTreasury);
    }

    function _setAllowOperatorClaim(bool _allowOperatorClaim) internal {
        allowOperatorClaim = _allowOperatorClaim;

        emit AllowOperatorClaimUpdated(_allowOperatorClaim);
    }

    function _setAttestationCenter(address _attestationCenter) internal {
        attestationCenter = _attestationCenter;

        emit AttestationCenterUpdated(_attestationCenter);
    }

    function _setL2AvsTreasury(address _l2AvsTreasury) internal {
        l2AvsTreasury = _l2AvsTreasury;

        emit L2AvsTreasuryUpdated(_l2AvsTreasury);
    }

    // TODO: othentic needs to expose protocol fee
    function _calculateRequiredAmount(uint256 _amount) internal pure returns (uint256) {
        return (_amount * 1_000_000) / 900_000;
    }

    function _authorizeUpgrade(address) internal view override onlyRole(ADMIN_ROLE) {}

    function version() external pure returns (uint256) {
        return 1;
    }
}
