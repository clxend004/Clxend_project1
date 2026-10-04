// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title EscrowAdvanced
/// @author Durai Prakash
/// @notice Holds ETH between a buyer and seller until the arbiter releases
/// the funds to the seller or refunds them to the buyer.
contract EscrowAdvanced {

    // =============================================================
    //                         CUSTOM ERRORS
    // =============================================================

    /// @notice Thrown when a deposit contains zero ETH.
    error MustSendETH();

    /// @notice Thrown when the caller is not the authorized arbiter.
    error OnlyArbiterAllowed();

    /// @notice Thrown when a function is called in an incorrect escrow state.
    error InvalidTransactionState();


    // =============================================================
    //                         STATE VARIABLES
    // =============================================================

    /// @notice Address of the buyer who creates the escrow.
    address public buyer;

    /// @notice Address of the seller who will receive released funds.
    address public seller;

    /// @notice Address authorized to release or refund escrow funds.
    address public arbiter;


    // =============================================================
    //                         ESCROW STATES
    // =============================================================

    /// @notice Represents the current lifecycle state of the escrow.
    enum State {
        Created,
        Funded,
        Released,
        Refunded
    }

    /// @notice Current state of the escrow transaction.
    State public state;


    // =============================================================
    //                            EVENTS
    // =============================================================

    /// @notice Emitted when the buyer deposits ETH into the escrow.
    /// @param buyer Address that deposited the ETH.
    /// @param amount Amount of ETH deposited.
    event Deposited(
        address indexed buyer,
        uint256 indexed amount
    );

    /// @notice Emitted when the arbiter releases funds to the seller.
    /// @param seller Address receiving the released ETH.
    /// @param amount Amount of ETH released.
    event Released(
        address indexed seller,
        uint256 indexed amount
    );

    /// @notice Emitted when the arbiter refunds funds to the buyer.
    /// @param buyer Address receiving the refunded ETH.
    /// @param amount Amount of ETH refunded.
    event Refunded(
        address indexed buyer,
        uint256 indexed amount
    );


    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    /// @notice Creates a new escrow contract.
    /// @param _seller Address of the seller.
    /// @param _arbiter Address authorized to release or refund funds.
    constructor(
        address _seller,
        address _arbiter
    ) {
        buyer = msg.sender;
        seller = _seller;
        arbiter = _arbiter;

        state = State.Created;
    }


    // =============================================================
    //                           MODIFIERS
    // =============================================================

    /// @notice Restricts a function to the authorized arbiter.
    modifier onlyArbiter() {
        if (msg.sender != arbiter) {
            revert OnlyArbiterAllowed();
        }

        _;
    }

    /// @notice Restricts a function to a specific escrow state.
    /// @param expectedState State required before executing the function.
    modifier inState(State expectedState) {
        if (state != expectedState) {
            revert InvalidTransactionState();
        }

        _;
    }


    // =============================================================
    //                            DEPOSIT
    // =============================================================

    /// @notice Deposits ETH into the escrow and moves the state to Funded.
    /// @dev The deposit must contain a non-zero amount of ETH.
    function deposit()
        external
        payable
        inState(State.Created)
    {
        if (msg.value == 0) {
            revert MustSendETH();
        }

        state = State.Funded;

        emit Deposited(msg.sender, msg.value);
    }


    // =============================================================
    //                            RELEASE
    // =============================================================

    /// @notice Releases all escrow funds to the seller.
    /// @dev Only the authorized arbiter can release funds.
    /// The escrow must currently be in the Funded state.
    function release()
        external
        onlyArbiter
        inState(State.Funded)
    {
        uint256 amount = address(this).balance;

        state = State.Released;

        payable(seller).transfer(amount);

        emit Released(seller, amount);
    }


    // =============================================================
    //                             REFUND
    // =============================================================

    /// @notice Refunds all escrow funds to the buyer.
    /// @dev Only the authorized arbiter can refund funds.
    /// The escrow must currently be in the Funded state.
    function refund()
        external
        onlyArbiter
        inState(State.Funded)
    {
        uint256 amount = address(this).balance;

        state = State.Refunded;

        payable(buyer).transfer(amount);

        emit Refunded(buyer, amount);
    }


    // =============================================================
    //                         VIEW FUNCTIONS
    // =============================================================

    /// @notice Returns the current ETH balance held by the escrow.
    /// @return balance Amount of ETH currently held by the contract.
    function getBalance()
        public
        view
        returns (uint256 balance)
    {
        return address(this).balance;
    }


    /// @notice Returns the current escrow lifecycle state as text.
    /// @return status Current state: Created, Funded, Released, or Refunded.
    function getCurrentState()
        public
        view
        returns (string memory status)
    {
        if (state == State.Created) {
            return "Created";
        }

        if (state == State.Funded) {
            return "Funded";
        }

        if (state == State.Released) {
            return "Released";
        }

        if (state == State.Refunded) {
            return "Refunded";
        }

        return "";
    }
}