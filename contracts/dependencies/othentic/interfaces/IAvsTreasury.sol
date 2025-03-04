// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.25;
/*______     __      __                              __      __ 
 /      \   /  |    /  |                            /  |    /  |
/$$$$$$  | _$$ |_   $$ |____    ______   _______   _$$ |_   $$/   _______ 
$$ |  $$ |/ $$   |  $$      \  /      \ /       \ / $$   |  /  | /       |
$$ |  $$ |$$$$$$/   $$$$$$$  |/$$$$$$  |$$$$$$$  |$$$$$$/   $$ |/$$$$$$$/ 
$$ |  $$ |  $$ | __ $$ |  $$ |$$    $$ |$$ |  $$ |  $$ | __ $$ |$$ |
$$ \__$$ |  $$ |/  |$$ |  $$ |$$$$$$$$/ $$ |  $$ |  $$ |/  |$$ |$$ \_____ 
$$    $$/   $$  $$/ $$ |  $$ |$$       |$$ |  $$ |  $$  $$/ $$ |$$       |
 $$$$$$/     $$$$/  $$/   $$/  $$$$$$$/ $$/   $$/    $$$$/  $$/  $$$$$$$/
*/
/**
 * @author Othentic Labs LTD.
 * @notice Terms of Service: https://www.othentic.xyz/terms-of-service
 */
interface IAvsTreasury {
    event RewardsDeposited(address avsTreasuryOwner, uint256 amount);
    event RewardWithdrawn(address indexed operator, uint256 lastPayedTask, uint256 feeToClaim);
    event RewardWithdrawalFailed(
        address indexed operator,
        uint256 lastPayedTask,
        uint256 feeToClaim
    );

    error NativeETHNotSupported();
    error ERC20NotSupported();
    error ZeroValueNotAllowed();
    error InvalidAmount();
    error TransferToOtTreasuryFailed();
    error InvalidProtocolFee();
    error TransferFailed();

    function depositNative() external payable;
    // @obselete
    function depositERC20(address _from, uint256 _amount) external;
    function depositERC20(uint256 _amount) external;
    function depositERC20WithCallback(
        address _from,
        uint256 _amount,
        bytes calldata _data
    ) external;
    function withdrawRewards(
        address _operator,
        uint256 _lastPayedTask,
        uint256 _feeToClaim
    ) external returns (bool success);
    function getToken() external view returns (address rewardsToken);
}
