// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.25;

import {IAttestationCenter} from "./IAttestationCenter.sol";

/**
 * @author Othentic Labs LTD.
 * @notice Terms of Service: https://www.othentic.xyz/terms-of-service
 * @notice Depending on the application, it may be necessary to add reentrancy gaurds to hooks
 */
interface IBeforePaymentsLogic {
    function beforePaymentRequest(
        uint256 _operatorId,
        IAttestationCenter.PaymentDetails calldata _paymentDetails,
        uint32 _taskNumber
    ) external;
}
