// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

/**
 * @title Storage
 * @notice Library for storage operations.
 */
library Storage {
    function getValueBySlot(bytes32 _slot) internal view returns (bytes32 _value) {
        assembly {
            _value := sload(_slot)
        }
    }

    function setValueBySlot(bytes32 _slot, bytes32 _value) internal {
        assembly {
            sstore(_slot, _value)
        }
    }

    function setAddressBySlot(bytes32 _slot, address _value) internal {
        assembly {
            sstore(_slot, _value)
        }
    }

    function getAddressBySlot(bytes32 _slot) internal view returns (address _value) {
        assembly {
            _value := sload(_slot)
        }
    }
}
