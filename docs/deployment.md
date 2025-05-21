# Deployment

The deployment is done in tree steps:

1. [Deploying the Dependencies](#deploying-the-dependencies)
2. [Deploying the Venn Contracts](#deploying-the-venn-contracts)
3. [Setting the protocols, operators, and subnets in the deployed contracts](#setting-the-protocols-operators-and-subnets-in-the-deployed-contracts)

## Deploying the Dependencies

1. Fill the `deploy/data/othenticConfig.ts` file with the following values. Note that the AVS_NAME must be unique and not have been used before.

- `l1Config`: The configuration for the L1 network.
  - `network`: The network name.
  - `avsName`: The unique name of the AVS.
  - `l2ChainIds`: The chain ids of the L2 networks.
  - `initialDeposit`: The initial deposit for the AVS.
- `l2Configs`: The configuration for the L2 networks.
  - `network`: The network name.
  - `avsName`: The unique name of the AVS (same as `l1Config.avsName`).
  - `l1ChainId`: The chain id of the L1 network.
  - `initialDeposit`: The initial deposit for the AVS.

2. Deploy the AVS contracts.

You may use the next commands to deploy the AVS contracts:

```bash
npx hardhat migrate --namespace othentic/L1 --network holesky --verify
```

The contracts, that you will have deployed, are:

- `L1`
  - `L1MessageHandler`: The message handler for the L1 AVS.
  - `AvsTreasury`: The treasury for the L1 AVS.
  - `AvsGovernance`: The governance for the L1 AVS.
  - `RemoteMessageHandler`: The remote message handler for the L1 AVS.

## Deploying the Venn Contracts

1. Fill the `deploy/data/vennConfig.ts` file with the correct values. You may use the previous deployed AttestationCenter and AVSGovernance addresses.

- `vennL1Config`: The configuration for the Venn contracts on L1.
  - `vennTokenConfig`: The configuration for the Venn token.
    - `initialSupply`: The initial supply of the Venn token.
- `vennL2Config`: The configuration for the Venn contracts on L2.
  - `vennTokenConfig`: The configuration for the Venn token.
    - `initialSupply`: The initial supply of the Venn token.
  - `operatorRegistryConfig`: The configuration for the operator registry.
    - `maxSubscribedOperatorsCount`: The maximum number of subscribed operators by operator for a single subnet.
  - `votingPowerSyncerConfig`: The configuration for the voting power syncer.
    - `syncer`: The address of the voting power syncer.

2. Run the deployment script of the Venn L1 contracts:

```bash
npx hardhat migrate --namespace venn/L1 --network holesky --verify
```

The contracts, that you will have deployed, are:

- `VennToken`: The Venn token.
- `VennStakingStrategy`: The Venn staking strategy for EigenLayer.

3. Run the deployment script of the Venn L2 + othentic contracts:

```bash
npx hardhat migrate --namespace venn/L2 --network holesky --verify
```

The contracts, that you will have deployed, are:


- `Othentic L2`
  - `Obls`: The OBLs for the L2 AVS.
  - `L2MessageHandler`: The message handler for the L2 AVS.
  - `AttestationCenter`: The attestation center for the L2 AVS.
  - `RemoteMessageHandler`: The remote message handler for the L2 AVS.
  - `AvsTreasury`: The treasury for the L2 AVS.
  - `InternalTaskHandler`: The internal task handler for the L2 AVS.

- `Venn L2`
  - `VennToken`: The Venn token.
  - `VennVaultL2`: The Venn vault on L2.
  - `Firewall`: The firewall for the Venn vault on L2.
  - `ProtocolRegistry`: The protocol registry.
  - `OperatorRegistry`: The operator registry.
  - `VennFeeCalculator`: The fee calculator for the Venn protocol.
  - `FeePool`: The fee pool for the Venn protocol.
  - `VennAvsLogic`: The Venn AVS logic.
  - `AttestationCenterProxy`: The attestation center proxy.
  - `VotingPowerSyncer`: The voting power syncer.

After this step you will have all the Venn contracts deployed, and can find them under `deploy/data/deployments.json`.

### New Subnet creation

1. Specify the subnet parameters in the `scripts/flows/createSubnet.ts` file:

- `subnetFee`: The optional fee for the subnet.
- `treasuries`: The optional bytes32 array of the treasuries ids.
- `treasuriesShares`: The optional shares of the treasuries.

Note: The `treasuriesShares` values should be less than 100% to keep some percentage for the next operators.

- `attesterFee`: The fee for the attester.
- `aggregatorFee`: The fee for the aggregator.
- `performerFee`: The fee for the performer.

Note: The `attesterFee`, `aggregatorFee`, and `performerFee` have to be 100%.

2. Run the `createSubnet` script.

```bash
npx hardhat run scripts/flows/createSubnet.ts --network holesky
```

3. Save the created `taskDefinitionId` for the next steps.

### Operator configuration

1. Specify the operator parameters in the `scripts/flows/dependencies/registerOperator.ts` file:

- `operatorPrivateKey`: The private key of the operator.
- `amountToDepositIntoEigenLayerStrategy`: The amount to deposit into the EigenLayer strategy.
- `metadata`: The metadata of the operator for the EigenLayer operator registration.

2. Run the `registerOperator` script.

```bash
npx hardhat run scripts/flows/dependencies/registerOperator.ts --network holesky
```

3. Specify the operator parameters in the `scripts/flows/registerOperator.ts` file:

- `operatorPrivateKey`: The private key of the operator.
- `subscribedOperators`: The array for each task definition id (subnet).
  - `taskDefinitionId`: The id of the task definition.
  - `subscribedOperators`: The array of subscribed security operators.
  - `subscribedOperatorFeeShares`: The shares of the subscribed security operators.

4. After waiting a few minutes for the L1->L2 message to be received, run the `registerOperator` script. You can check the syncing status at https://testnet.layerzeroscan.com/address/L2_MESSAGE_HANDLER-ADDRESS-HERE

```bash
npx hardhat run scripts/flows/registerOperator.ts --network holesky
```

5. Specify the list of operators for each subnet in the `scripts/flows/setTaskDefinitionRestrictedAttesters.ts` file:

- `taskDefinitionId`: The id of the task definition.
- `restrictedAttesters`: The array of allowed operators.

6. Run the `setTaskDefinitionRestrictedAttesters` script.

```bash
npx hardhat run scripts/flows/setTaskDefinitionRestrictedAttesters.ts --network holesky
```

### Protocol configuration

1. Deploy test protocols.

```bash
npx hardhat migrate --namespace mock --network holesky --verify --only 1
```

2. Save the deployed policy address for the next steps.

3. Specify the protocol parameters in the `scripts/flows/registerProtocols.ts` file:

- `policyAddress`: The address of the policy. You can use the previous deployed policy address.
- `subnets`: The array of subnets.
  - `taskDefinitionId`: The id of the task definition.
  - `requiredOperatorIds`: The array of required operator ids (veto logics).

4. Run the `registerProtocol` script.

```bash
npx hardhat run scripts/flows/registerProtocol.ts --network holesky
```

## Validating the deployment

1. Run the `parseTopology` script.

```bash
npx hardhat run scripts/flows/parseTopology.ts --network holesky
```

2. Check the `topology.json` file.
