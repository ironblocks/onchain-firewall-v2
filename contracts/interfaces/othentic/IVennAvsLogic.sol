// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IFeePool} from "./IFeePool.sol";
import {IAvsLogicBase} from "./IAvsLogicBase.sol";

import {IProtocolRegistry} from "../IProtocolRegistry.sol";

/**
 * @title IVennAvsLogic
 * @notice Interface for the VennAvsLogic contract.
 */
interface IVennAvsLogic is IAvsLogicBase {
    /**
     * @dev Emitted when the fee pool is updated.
     * @param newFeePool The new fee pool.
     */
    event FeePoolUpdated(address newFeePool);

    /**
     * @dev Emitted when the protocol registry is updated
     * @param newProtocolRegistry The new protocol registry.
     */
    event ProtocolRegistryUpdated(address newProtocolRegistry);

    /**
     * @dev Set the fee pool address
     * @param _feePool The fee pool address.
     */
    function setFeePool(address _feePool) external;

    /**
     * @dev Set the protocol registry address
     * @param _protocolRegistry The protocol registry address.
     */
    function setProtocolRegistry(address _protocolRegistry) external;

    /**
     * @dev Get the fee pool address
     * @return The fee pool address.
     */
    function feePool() external view returns (IFeePool);

    /**
     * @dev Get the protocol registry address
     * @return The protocol registry address.
     */
    function protocolRegistry() external view returns (IProtocolRegistry);
}
