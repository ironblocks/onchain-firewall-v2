//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8;

import {TransientApprovedCallsPolicy} from "./TransientApprovedCallsPolicy.sol";

import {ITransientApprovedCallsPolicyFactory} from "../interfaces/policies/ITransientApprovedCallsPolicyFactory.sol";

contract TransientApprovedCallsPolicyFactory is ITransientApprovedCallsPolicyFactory {
    function create(bytes calldata _data) external returns (address policy) {
        (
            address firewall,
            address defaultAdmin,
            address policyAdmin,
            address[] memory signers,
            address[] memory consumers,
            bool[] memory consumerStatuses
        ) = abi.decode(_data, (address, address, address, address[], address[], bool[]));

        policy = _create(
            firewall,
            defaultAdmin,
            policyAdmin,
            signers,
            consumers,
            consumerStatuses
        );

        emit PolicyCreated(policy);
    }

    function _create(
        address _firewall,
        address _defaultAdmin,
        address _policyAdmin,
        address[] memory _signers,
        address[] memory _consumers,
        bool[] memory _consumerStatuses
    ) private returns (address) {
        TransientApprovedCallsPolicy policy = new TransientApprovedCallsPolicy(_firewall);

        bytes32 defaultAdminRole = policy.DEFAULT_ADMIN_ROLE();
        bytes32 policyAdminRole = policy.POLICY_ADMIN_ROLE();
        bytes32 signerRole = policy.SIGNER_ROLE();

        policy.grantRole(defaultAdminRole, _defaultAdmin);
        policy.grantRole(policyAdminRole, _policyAdmin);
        policy.grantRole(policyAdminRole, address(this));

        for (uint256 i = 0; i < _signers.length; i++) {
            policy.grantRole(signerRole, _signers[i]);
        }
        policy.setConsumersStatuses(_consumers, _consumerStatuses);

        policy.revokeRole(policyAdminRole, address(this));
        policy.revokeRole(defaultAdminRole, address(this));

        return address(policy);
    }
}
