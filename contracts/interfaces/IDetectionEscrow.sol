// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

interface IDetectionEscrow {
    /**
     * @dev Emitted when funds are withdrawn.
     * @param amount The amount of the funds withdrawn.
     */
    event FundsWithdrawn(uint256 amount);

    /**
     * @dev Emitted when a payment is requested.
     * @param amount The amount of the payment.
     * @param invoiceDetails The invoice details.
     */
    event PaymentRequested(uint256 amount, string invoiceDetails);

    /**
     * @dev Emitted when a payment is approved.
     * @param amount The amount of the payment.
     */
    event PaymentApproved(uint256 amount);

    /**
     * @dev Emitted when a payment is sent.
     * @param amount The amount of the payment.
     */
    event PaymentSent(uint256 amount);

    /**
     * @dev Emitted when a venn fee is sent.
     * @param amount The amount of the venn fee.
     */
    event VennFeeSent(uint256 amount);

    /**
     * @dev Approve a claim payment.
     * @param _amount The amount of the payment.
     */
    function approveClaimPayment(uint256 _amount) external;

    /**
     * @dev Withdraw funds.
     * @param _amount The amount of the funds to withdraw.
     */
    function withdrawFunds(uint256 _amount) external;

    /**
     * @dev Initialize a claim payment.
     * @param _amount The amount of the payment.
     * @param _invoiceDetails The invoice details.
     */
    function initializeClaimPayment(uint256 _amount, string memory _invoiceDetails) external;

    /**
     * @dev Initialize a claim payment.
     * @param _amount The amount of the payment.
     */
    function initializeClaimPayment(uint256 _amount) external;

    /**
     * @dev Get the protocol registry address.
     * @return The protocol registry address.
     */
    function protocolRegistry() external view returns (address);

    /**
     * @dev Get the operator address.
     * @return The operator address.
     */
    function operator() external view returns (address payable);

    /**
     * @dev Get the protocol admin address.
     * @return The protocol admin address.
     */
    function protocolAdmin() external view returns (address payable);

    /**
     * @dev Get the pending operator payment.
     * @return The pending operator payment.
     */
    function pendingOperatorPayment() external view returns (uint256);
}
