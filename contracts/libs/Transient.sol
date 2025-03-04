// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

/**
 * @title Transient
 * @notice Library for transient storage.
 */
library Transient {
    /**
     * @dev Returns the value stored at the given slot.
     * @param _slot The slot to read from.
     * @return _value The value stored at the given slot.
     */
    function getValueBySlot(bytes32 _slot) internal view returns (bytes32 _value) {
        assembly {
            _value := tload(_slot)
        }
    }

    /**
     * @dev Sets the value at the given slot.
     * @param _slot The slot to write to.
     * @param _value The value to write.
     */
    function setValueBySlot(bytes32 _slot, bytes32 _value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(_slot, _value)
        }
    }
}
