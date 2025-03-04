// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

contract VennToken is ERC20Upgradeable, Ownable2StepUpgradeable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __VennToken_init(uint256 _initialSupply) external initializer {
        __ERC20_init("Venn network", "VENN");
        __Ownable2Step_init();

        _mint(msg.sender, _initialSupply);
    }

    function _authorizeUpgrade(address) internal view override onlyOwner {}

    function version() external pure returns (uint256) {
        return 1;
    }
}
