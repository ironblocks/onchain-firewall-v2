# Venn Protocol Smart Contracts

## Contracts Overview

### 1. DetectionEscrow.sol

The `DetectionEscrow` contract manages the payment process for claims approved by the protocol admin.

### 2. Firewall.sol

The `Firewall` contract provides an open marketplace for firewall policies that can be subscribed to by consumers. It allows for the management of policies, enabling consumers to add or remove policies as needed. The contract ensures that calls to consumer contracts are validated against the defined policies.

### 3. OperatorRegistry.sol

The `OperatorRegistry` contract serves as a central registry for operators. It allows for the registration of operators and the subscription to other operators (e.g. security providers).

### 4. ProtocolRegistry.sol

The `ProtocolRegistry` contract serves as a central registry for protocols and their associated detection mechanisms. It allows for the creation and registration of protocol detections, manages protocol fees, and ensures that only authorized policies can be registered.

### 5. VennToken.sol

The `VennToken` contract is an ERC20 token that represents the native currency of the Venn Protocol.

### 6. consumers/VennFirewallConsumerBase.sol

The `VennFirewallConsumerBase` contract is an abstract base contract that provides firewall protection to any contract that inherits from it. It defines the necessary hooks for pre-execution and post-execution checks against the firewall policies.

### 7. consumers/presets/VennFirewallConsumer.sol

The `VennFirewallConsumer` contract extends the `VennFirewallConsumerBase` and allows for the implementation of firewall protection in consumer contracts. It sets up the necessary storage slots for the firewall and firewall admin addresses. It can be used for non-upgradeable contracts.

### 8. consumers/presets/proxy/ProxyVennFirewallConsumer.sol

The `ProxyVennFirewallConsumer` contract is an abstract contract that allows for the initialization of the firewall admin in proxy scenarios. It ensures that the firewall admin can be set even if the contract was originally deployed with a zero address.

### 9. consumers/presets/proxy/BeaconProxyVennFirewallConsumer.sol

The `BeaconProxyVennFirewallConsumer` contract extends the `ProxyVennFirewallConsumer` and allows the Beacon Proxy Owner to initialize the firewall admin.

### 10. consumers/presets/proxy/TransparentProxyVennFirewallConsumer.sol

The `TransparentProxyVennFirewallConsumer` contract is similar to the `BeaconProxyVennFirewallConsumer`, but it is designed for transparent proxies.

### 11. gnosis-safe/FirewallModule.sol

The `FirewallModule` contract is a module for the gnosis safe. It allows for the management of firewall policies and the ability to subscribe to them. It is used to automatically subscribe to the firewall policies during the deployment using the `Factory` contract.

### 12. gnosis-safe/VennGuard.sol

The `VennGuard` contract is a security guard for the gnosis safe transactions.

### 13. othentic/AttestationCenterProxy.sol

The `AttestationCenterProxy` contract is a proxy for the `AttestationCenter` contract. It allows provide a fee value to the `AttestationCenter` contract when submitting tasks.

### 14. othentic/FeePool.sol

The `FeePool` contract is a contract that allows for the management of the fees.

### 15. othentic/VennAvsLogic.sol

The `VennAvsLogic` contract is a contract that provides the logic for the `AttestationCenter` contract. It is used to validate the task submission and ensure that the correct fee is provided. It also provides the logic for the `veto / requiredOperators` mechanism.

### 16. othentic/VennFeeCalculator.sol

The `VennFeeCalculator` contract is a contract that provides the logic for the fee calculation. It is used to calculate the fee for the `AttestationCenter` contract.

### 17. othentic/VennVaultL2.sol

The `VennVaultL2` contract is a contract that provides the logic for the `AttestationCenter` contract. It is minting the rewards and providing the logic for the `beforePaymentRequest` hook.

### 18. policies/TransientApprovedCallsPolicy.sol

The `TransientApprovedCallsPolicy` contract is a policy that requires a transaction to a consumer to be signed and approved on chain before execution.

### 19. policies/DynamicTransientApprovedCallsPolicy.sol

The `DynamicTransientApprovedCallsPolicy` contract is an extension of the `TransientApprovedCallsPolicy` contract. It allows to have a range of values for the uint256 types values during execution.

### 20. policies/PolicyDeployer.sol

The `PolicyDeployer` contract is a contract that allows for the deployment of policies. It is used to deploy the `TransientApprovedCallsPolicy` contract. It also approves the policies to the `Firewall` contract.

Visit the [Venn Architecture](./docs/vennArchitecture.md) for more details.

## Install Dependencies

Install the dependencies by running the following command:

```bash
npm install
```

## Compilation

To compile the contracts, use the next script:

```bash
npm run build
```

## Environment Variables

Before any following steps, you need to create an `.env` file following the example of `.env.example`.

## Test

To run the tests, execute the following command:

```bash
npm run test
```

To run the tests for forked network, run:

> You need to set the `FORKING_URL` and `FORKING_BLOCK_NUMBER` environment variables to run the tests for forked network.

```bash
npm run test-fork
```

To see the coverage, run:

> You need to set the `FORKING_URL` and `FORKING_BLOCK_NUMBER` environment variables to run the coverage.

```bash
npm run coverage
```

## Deployments

To deploy the contracts, setup the params in the `deploy/data/config.ts` file and run:

> You need to set the `PRIVATE_KEY` environment variable to deploy the contracts. And you need to have the `ETHERSCAN_KEY` environment variable set to verify the contracts in Etherscan.

```bash
npx hardhat migrate --namespace venn/L2 --network <network> --verify
```

You may check the [Deployment Guide](./docs/deployment.md) for more details.

## Local Deployment

To deploy the contracts in the local network, you need to fork the network and run the migrations.

```bash
npx hardhat node --fork <forking-url>
npx hardhat migrate --namespace venn/L2 --network localhost --verify
```

## Bindings

The command to generate the bindings is as follows:

```bash
npm run generate-types
```

> See the full list of available commands in the `package.json` file.
