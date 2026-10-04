# BC-W3-T1 – Escrow Contract Architecture Documentation
## 1. Overview

The Escrow Smart Contract is designed to securely hold funds between two parties until predefined conditions are met.

The contract ensures:

- Funds are safely stored on the blockchain.

- Only authorized roles can execute contract actions.

- Clear lifecycle management through defined contract states.

The escrow contract supports three main roles:

- Payer – the party depositing funds.

- Payee – the party receiving funds after completion.

- Arbitrator (optional) – a third party that resolves disputes.

---

## 2. Escrow State Structure

The contract follows a state-based lifecycle to control the flow of funds.

| State    | Description                              |
| -------- | ---------------------------------------- |
| Created  | Contract deployed but no funds deposited |
| Funded   | Payer has deposited ETH into the escrow  |
| Released | Funds transferred to the payee           |
| Refunded | Funds returned to the payer              |


State definition example:

#### enum State { Created, Funded, Released, Refunded}

The state variable tracks the current status of the escrow contract.

#### State public currentState;

----

## 3. Escrow State Transition Flow

The contract enforces strict transitions between states.
```
Created
   │
   ▼
Funded
  │   │
  │   ▼
  │ Released
  │
  ▼
Refunded
```

### Transition Rules

| Current State | Function  | Next State |
| ------------- | --------- | ---------- |
| Created       | deposit() | Funded     |
| Funded        | release() | Released   |
| Funded        | refund()  | Refunded   |


Invalid transitions are prevented using require conditions.

### Example:

#### require(currentState == State.Funded, "Escrow not funded");

---
## 4. Role Model

The escrow contract defines specific roles that control interactions with the contract.

| Role       | Description                                         |
| ---------- | --------------------------------------------------- |
| Payer      | Deposits ETH into the contract                      |
| Payee      | Receives funds when escrow is released              |
| Arbitrator | Resolves disputes and may approve release or refund |


### Example storage variables:

#### address public payer;
#### address public payee;
#### address public arbitrator;

These roles are assigned during contract deployment.

---

## 5. Contract Storage Structure

The escrow contract stores the following information on-chain.

| Variable     | Type    | Description                  |
| ------------ | ------- | ---------------------------- |
| payer        | address | wallet address of the payer  |
| payee        | address | wallet address of the payee  |
| arbitrator   | address | dispute resolution authority |
| amount       | uint256 | total escrow value           |
| currentState | enum    | current contract state       |


### Example structure:

contract Escrow {

    enum State { Created, Funded, Released, Refunded }

    address public payer;
    address public payee;
    address public arbitrator;

    uint256 public amount;

    State public currentState;
}

---

## 6. Function Signatures

The escrow contract provides three core functions.

### deposit()

Allows the payer to deposit ETH into the escrow contract.

function deposit() external payable;

Responsibilities:

- Accept ETH from payer

- Update escrow amount

- Change state to Funded

### release()

Transfers the escrow funds to the payee.

function release() external;

Responsibilities:

- Verify escrow is funded

- Transfer funds to payee

- Change state to Released

### refund()

Returns escrow funds back to the payer.

function refund() external;

Responsibilities:

- Validate refund conditions

- Transfer funds back to payer

- Change state to Refunded

---

## 7. Access Control Logic

Access control ensures only authorized participants execute specific functions.

| Function  | Authorized Role     |
| --------- | ------------------- |
| deposit() | Payer               |
| release() | Arbitrator or Payer |
| refund()  | Arbitrator          |


### Access control example:

modifier onlyPayer() {
    require(msg.sender == payer, "Not payer");
    _;
}

modifier onlyArbitrator() {
    require(msg.sender == arbitrator, "Not arbitrator");
    _;
}

### Example usage:

function deposit() external payable onlyPayer {
}

This ensures that unauthorized users cannot manipulate escrow funds.

