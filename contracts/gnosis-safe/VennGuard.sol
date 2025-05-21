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

    // keccak256(
    //     "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
    // );
    bytes32 private constant SAFE_TX_TYPEHASH =
        0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8;

    uint256 public constant MAX_BYPASS_GUARD_WAIT_TIME = 7 days;
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address public immutable attestationCenterProxy;
    address public immutable multisendContract;
    address public immutable safe;

    uint256 public nonce;
    uint256 public bypassGuardWaitTime;

    bool public enabled = true;

    mapping(bytes32 safeTxHash => uint256 initTime) public bypassGuardInitTime;

    event BypassGuard(bytes32 safeTxHash, uint256 initTime);
    event TransactionBypassed(bytes32 safeTxHash);
    event SetEnabled(bool enabled);

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
        bytes memory encodedTransactionData = _encodeTransactionData(
            to,
            value,
            data,
            operation,
            safeTxGas,
            baseGas,
            gasPrice,
            gasToken,
            refundReceiver,
            gnosisSafeNonce
        );

        bytes32 txHash = keccak256(encodedTransactionData);
        require(bypassGuardInitTime[txHash] == 0, "FirewallGuard: bypassGuard already called");
        IGnosisSafe(safe).checkSignatures(txHash, encodedTransactionData, signatures);
        bypassGuardInitTime[txHash] = block.timestamp;

        emit BypassGuard(txHash, block.timestamp);
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
        if (!enabled) return;

        require(msg.sender == safe, "VennGuard: only safe can call");

        bytes32 txHash;
        {
            uint256 gnosisSafeNonce = IGnosisSafe(safe).nonce();
            txHash = IGnosisSafe(safe).getTransactionHash(
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
        }

        // If bypassGuard was called, allow the transaction to be executed if the wait time has passed
        // without checking firewall.
        if (
            bypassGuardInitTime[txHash] > 0 &&
            block.timestamp > bypassGuardInitTime[txHash] + bypassGuardWaitTime
        ) {
            emit TransactionBypassed(txHash);
            return;
        }

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

    function checkAfterExecution(bytes32 txHash, bool) external view {
        if (!enabled) return;

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

    /**
     * @dev We add a global bypass in case of misconfiguration, to prevent freezing safes. Once it
     * can be confirmed that the safe and guard are configured correctly, the roles can be revoked
     * @param _enabled The new enabled state of the guard.
     */
    function setEnabled(bool _enabled) external onlyRole(ADMIN_ROLE) {
        enabled = _enabled;
        emit SetEnabled(_enabled);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControl, IERC165) returns (bool) {
        require(msg.sender == safe, "VennGuard: only safe can call");
        return
            AccessControl.supportsInterface(interfaceId) ||
            interfaceId == type(IGuard).interfaceId || // 0xe6d7a83a
            interfaceId == type(IERC165).interfaceId; // 0x01ffc9a7
    }

    function _parseMultisendCall(
        bytes memory data
    ) internal pure returns (address, uint256, bytes memory) {
        uint256 transactionsLength;
        address to;
        uint256 value;
        uint256 dataLength;
        assembly {
            // Memory layout of `bytes memory data` argument:
            //
            //  | length of data bytearray (32) | data... |
            //
            // data:
            // | multiSend selector (4) | offset to transactions (32) | transactions length (32) | transactions... |
            //
            // transactions:
            // | Txn1 | Txn2 | ... | TxnN |
            //
            // Txn:
            // | operation (1) | to (20) | value (32) | calldata length (32) | calldata (length) |
            let i := 0x20
            i := add(i, 0x24)
            transactionsLength := mload(add(data, i))
            i := add(i, 0x20)
            // data + i points to Txn1
            to := shr(0x60, mload(add(data, add(i, 0x1)))) // operation (1)
            value := mload(add(data, add(i, 0x15))) // operation (1) | to (0x14)
            dataLength := mload(add(data, add(i, 0x35))) // operation (1) | to (0x14) | value (0x20)
        }

        // selector (0x4) + offset (0x20) + transactions length (0x20) +
        // operation (0x1) + to (0x14) + value (0x20) + txn1 calldata Length (0x20) +
        // calldata (dataLength)
        uint256 firstTxEndIndex = 0x4 + 0x20 + 0x20 + 0x1 + 0x14 + 0x20 + 0x20 + dataLength;
        uint256 lastTxEndIndex = 0x4 + 0x20 + 0x20 + transactionsLength;

        // Extract the remaining transactions data (excluding the first transaction)
        bytes memory remainingData;
        if (firstTxEndIndex < lastTxEndIndex) {
            uint256 remainingLength = lastTxEndIndex - firstTxEndIndex;
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

    function _encodeTransactionData(
        address to,
        uint256 value,
        bytes memory data,
        IGnosisSafe.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address refundReceiver,
        uint256 _nonce
    ) public view returns (bytes memory) {
        bytes32 domainSeparator = IGnosisSafe(safe).domainSeparator();
        bytes32 safeTxHash = keccak256(
            abi.encode(
                SAFE_TX_TYPEHASH,
                to,
                value,
                keccak256(data),
                operation,
                safeTxGas,
                baseGas,
                gasPrice,
                gasToken,
                refundReceiver,
                _nonce
            )
        );
        return abi.encodePacked(bytes1(0x19), bytes1(0x01), domainSeparator, safeTxHash);
    }
}
