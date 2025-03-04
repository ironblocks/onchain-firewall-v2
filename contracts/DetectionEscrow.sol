// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import {IDetectionEscrow} from "./interfaces/IDetectionEscrow.sol";
import {IProtocolRegistry} from "./interfaces/IProtocolRegistry.sol";

import {FEE_SCALE} from "./helpers/Constants.sol";

contract DetectionEscrow is IDetectionEscrow {
    using Address for address payable;

    address public protocolRegistry;
    address payable public operator;
    address payable public protocolAdmin;

    uint256 public pendingOperatorPayment;

    modifier onlyOperator() {
        require(msg.sender == operator, "DetectionEscrow: Only operator.");
        _;
    }

    modifier onlyProtocolAdmin() {
        require(msg.sender == protocolAdmin, "DetectionEscrow: Only protocol admin.");
        _;
    }

    constructor(address _protocolRegistry, address _protocolAdmin, address _operator) {
        protocolRegistry = _protocolRegistry;
        protocolAdmin = payable(_protocolAdmin);
        operator = payable(_operator);
    }

    function approveClaimPayment(uint256 _amount) external onlyProtocolAdmin {
        require(pendingOperatorPayment == _amount, "DetectionEscrow: Amount mismatch.");

        require(address(this).balance >= _amount, "DetectionEscrow: Insufficient balance.");

        uint256 vennDetectionFee = IProtocolRegistry(protocolRegistry).vennDetectionFee();
        address vennFeeRecipient = IProtocolRegistry(protocolRegistry).vennFeeRecipient();

        uint256 vennDetectionFeeAmount = (_amount * vennDetectionFee) / FEE_SCALE;
        uint256 operatorPayment = _amount - vennDetectionFeeAmount;

        pendingOperatorPayment = 0;

        operator.sendValue(operatorPayment);

        payable(vennFeeRecipient).sendValue(vennDetectionFeeAmount);

        emit PaymentApproved(_amount);
        emit PaymentSent(operatorPayment);
        emit VennFeeSent(vennDetectionFeeAmount);
    }

    function withdrawFunds(uint256 _amount) external onlyProtocolAdmin {
        protocolAdmin.sendValue(_amount);

        emit FundsWithdrawn(_amount);
    }

    function initializeClaimPayment(
        uint256 _amount,
        string memory _invoiceDetails
    ) public onlyOperator {
        pendingOperatorPayment = _amount;

        emit PaymentRequested(_amount, _invoiceDetails);
    }

    function initializeClaimPayment(uint256 _amount) external onlyOperator {
        initializeClaimPayment(_amount, "");
    }

    receive() external payable {}
}
