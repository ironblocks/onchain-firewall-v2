// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IGuard} from "../dependencies/gnosis-safe/IGuard.sol";
import {IGnosisSafe} from "../dependencies/gnosis-safe/IGnosisSafe.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Transient} from "../libs/Transient.sol";
contract VennGuard is IGuard, AccessControl {
    using Transient for bytes32;

    uint256 public constant MAX_BYPASS_GUARD_WAIT_TIME = 7 days;
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    address public immutable attestationCenterProxy;
    address public immutable multisendContract;
    address public immutable safe;

    uint256 public nonce;
    uint256 public bypassGuardWaitTime;

    mapping(bytes32 safeTxHash => uint256 initTime) public bypassGuardInitTime;

    constructor(
        address _attestationCenterProxy,
        address _multisendContract,
        address _safe,
        uint256 _bypassGuardWaitTime
    ) {
        require(
            _bypassGuardWaitTime <= MAX_BYPASS_GUARD_WAIT_TIME,
            "VennGuard: bypassGuardWaitTime too high"
        );
        attestationCenterProxy = _attestationCenterProxy;
        multisendContract = _multisendContract;
        safe = _safe;
        bypassGuardWaitTime = _bypassGuardWaitTime;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function bypassGuard(
        address to,
        uint256 value,
        bytes memory data,
        IGnosisSafe.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes memory signatures
    ) external {
        uint256 gnosisSafeNonce = IGnosisSafe(safe).nonce();
        bytes memory txHashData = IGnosisSafe(safe).encodeTransactionData(
            // Transaction info
            to,
            value,
            data,
            operation,
            safeTxGas,
            // Payment info
            baseGas,
            gasPrice,
            gasToken,
            refundReceiver,
            // Signature info
            gnosisSafeNonce
        );
        bytes32 txHash = keccak256(txHashData);
        require(bypassGuardInitTime[txHash] == 0, "FirewallGuard: bypassGuard already called");
        IGnosisSafe(safe).checkSignatures(txHash, txHashData, signatures);
        bypassGuardInitTime[txHash] = block.timestamp;
    }

    function checkTransaction(
        address to,
        uint256 value,
        bytes memory data,
        IGnosisSafe.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes memory,
        address
    ) external {
        require(msg.sender == safe, "VennGuard: only safe can call");

        bytes32 txHash;
        {
            uint gnosisSafeNonce = IGnosisSafe(safe).nonce();
            bytes memory txHashData = IGnosisSafe(safe).encodeTransactionData(
                // Transaction info
                to,
                value,
                data,
                operation,
                safeTxGas,
                // Payment info
                baseGas,
                gasPrice,
                gasToken,
                refundReceiver,
                // Signature info
                gnosisSafeNonce - 1 // We subtract 1 because the nonce is incremented before the transaction is executed
            );
            txHash = keccak256(txHashData);
        }

        // If bypassGuard was called, allow the transaction to be executed if the wait time has passed
        // without checking firewall.
        if (
            bypassGuardInitTime[txHash] > 0 &&
            block.timestamp > bypassGuardInitTime[txHash] + bypassGuardWaitTime
        ) return;

        require(to == multisendContract, "VennGuard: Only multisend contract can be called.");
        (
            address firstTxTo,
            uint256 firstTxValue,
            bytes memory remainingData
        ) = _parseMultisendCall(data);
        require(firstTxTo == attestationCenterProxy, "VennGuard: Invalid first multisend call.");
        require(firstTxValue == 0, "VennGuard: Invalid multisend call.");
        require(remainingData.length > 0, "VennGuard: Invalid multisend call.");
        bytes32 metaTxHash = keccak256(remainingData);
        bytes32(0).setValueBySlot(metaTxHash);
    }

    function approveMetaTxHash(
        bytes32 metaTxHash,
        uint256 _expiration,
        uint256 _nonce
    ) external onlyRole(SIGNER_ROLE) {
        require(nonce == _nonce, "VennGuard: Invalid nonce.");
        require(_expiration > block.timestamp, "VennGuard: Expired.");
        nonce = _nonce + 1;
        bytes32(uint256(1)).setValueBySlot(metaTxHash);
    }

    function checkAfterExecution(bytes32 txHash, bool) external view {
        // If bypassGuard was called, allow the transaction to be executed if the wait time has passed
        // without checking firewall.
        if (
            bypassGuardInitTime[txHash] > 0 &&
            block.timestamp > bypassGuardInitTime[txHash] + bypassGuardWaitTime
        ) return;

        bytes32 metaTxHash = bytes32(uint256(0)).getValueBySlot();
        bytes32 approvedMetaTxHash = bytes32(uint256(1)).getValueBySlot();
        require(metaTxHash != bytes32(0), "VennGuard: Invalid meta tx hash.");
        require(approvedMetaTxHash == metaTxHash, "VennGuard: Invalid meta tx hash.");
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControl, IERC165) returns (bool) {
        return
            AccessControl.supportsInterface(interfaceId) ||
            interfaceId == type(IGuard).interfaceId || // 0xe6d7a83a
            interfaceId == type(IERC165).interfaceId; // 0x01ffc9a7
    }

    function _parseMultisendCall(
        bytes memory data
    ) internal pure returns (address, uint256, bytes memory) {
        // The first 4 bytes are the function selector for multiSend
        // The next 32 bytes are the offset to the transactions data
        // Then comes the length of the transactions data (32 bytes)
        // After that, the actual transactions data starts

        // Skip function selector (4 bytes) and offset (32 bytes)
        uint256 startPos = 36;

        // Read the length of the transactions data (next 32 bytes)
        uint256 transactionsLength;
        assembly {
            transactionsLength := mload(add(data, startPos))
        }

        // Move to the start of the actual transactions data
        startPos += 32;

        // Extract the first transaction details
        // First byte is operation
        uint8 operation;
        assembly {
            operation := shr(0xf8, mload(add(data, add(startPos, 0x20))))
        }

        // Next 20 bytes are the 'to' address
        address to;
        assembly {
            to := shr(0x60, mload(add(data, add(startPos, 0x21))))
        }

        // Next 32 bytes are the value
        uint256 value;
        assembly {
            value := mload(add(data, add(startPos, 0x35)))
        }

        // Next 32 bytes are the data length
        uint256 dataLength;
        assembly {
            dataLength := mload(add(data, add(startPos, 0x55)))
        }

        // Calculate the end index of the first transaction
        // 1 byte (operation) + 20 bytes (to) + 32 bytes (value) + 32 bytes (dataLength) + dataLength
        uint256 firstTxEndIndex = startPos + 0x20 + 0x55 + dataLength;

        // Extract the remaining transactions data (excluding the first transaction)
        bytes memory remainingData;
        if (firstTxEndIndex < startPos + 0x20 + transactionsLength) {
            uint256 remainingLength = startPos + 0x20 + transactionsLength - firstTxEndIndex;
            remainingData = new bytes(remainingLength);

            for (uint256 i = 0; i < remainingLength; i++) {
                remainingData[i] = data[firstTxEndIndex + i];
            }
        } else {
            // No remaining transactions
            remainingData = new bytes(0);
        }

        return (to, value, remainingData);
    }
}
