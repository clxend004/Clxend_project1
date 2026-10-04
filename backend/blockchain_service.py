"""
VECTRO -> Blockchain API integration service.

This file is the bridge between the VECTRO FastAPI backend
(port 8000) and the separate blockchain API
(port 3001).

IMPORTANT:
- Private keys are never handled here.
- The blockchain API is responsible for private-key storage.
- VECTRO only receives/stores the public wallet address.
"""

import os
import requests


# ------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------

BLOCKCHAIN_API_URL = os.getenv(
    "BLOCKCHAIN_API_URL",
    "http://127.0.0.1:3001",
).rstrip("/")

BLOCKCHAIN_TIMEOUT = int(
    os.getenv(
        "BLOCKCHAIN_TIMEOUT",
        "15",
    )
)


# ------------------------------------------------------------
# INTERNAL REQUEST HELPER
# ------------------------------------------------------------

def _request(
    method: str,
    path: str,
    payload: dict | None = None,
):
    """
    Send a request to the separate blockchain API.
    """

    url = f"{BLOCKCHAIN_API_URL}{path}"

    try:
        response = requests.request(
            method=method,
            url=url,
            json=payload,
            timeout=BLOCKCHAIN_TIMEOUT,
        )

    except requests.RequestException as error:
        raise RuntimeError(
            "Unable to connect to the blockchain service "
            f"at {BLOCKCHAIN_API_URL}: {error}"
        ) from error

    try:
        data = response.json()
    except ValueError:
        data = {
            "success": False,
            "error": response.text,
        }

    if response.status_code >= 400:
        message = (
            data.get("error")
            or data.get("message")
            or f"Blockchain API returned HTTP {response.status_code}"
        )

        raise RuntimeError(message)

    if isinstance(data, dict) and data.get("success") is False:
        raise RuntimeError(
            data.get("error")
            or data.get("message")
            or "Blockchain API request failed"
        )

    return data


# ------------------------------------------------------------
# HEALTH CHECK
# ------------------------------------------------------------

def check_blockchain_service():
    """
    Check whether the blockchain API is running.
    """

    return _request(
        "GET",
        "/",
    )


# ------------------------------------------------------------
# CREATE WALLET
# ------------------------------------------------------------

def create_blockchain_wallet(
    did: str,
    chain: str = "sepolia",
):
    """
    Create a real blockchain wallet for a VECTRO DID.

    The blockchain service generates and securely stores
    the encrypted private key.

    VECTRO receives only public wallet information.
    """

    if not did:
        raise ValueError(
            "DID is required to create a blockchain wallet."
        )

    result = _request(
        "POST",
        "/wallets/create",
        {
            "did": did,
            "chain": chain,
        },
    )

    wallet = result.get("wallet")

    if not wallet:
        raise RuntimeError(
            "Blockchain wallet creation succeeded but "
            "no wallet data was returned."
        )

    wallet_address = wallet.get(
        "wallet_address"
    )

    if not wallet_address:
        raise RuntimeError(
            "Blockchain service did not return "
            "a wallet address."
        )

    return {
        "mapping_id": wallet.get(
            "mapping_id"
        ),
        "did": wallet.get(
            "did",
            did,
        ),
        "wallet_address": wallet_address,
        "chain": wallet.get(
            "chain",
            chain,
        ),
        "status": wallet.get(
            "status",
            "created",
        ),
        "created_at": wallet.get(
            "created_at"
        ),
    }


# ------------------------------------------------------------
# GET WALLET BY DID
# ------------------------------------------------------------

def get_blockchain_wallet(
    did: str,
):
    """
    Retrieve an existing blockchain wallet
    using the VECTRO DID.
    """

    if not did:
        raise ValueError(
            "DID is required."
        )

    return _request(
        "GET",
        f"/wallets/{did}",
    )


# ------------------------------------------------------------
# GET WALLET BALANCE
# ------------------------------------------------------------

def get_blockchain_balance(
    did: str,
):
    """
    Retrieve the real Sepolia blockchain balance
    for a VECTRO DID.
    """

    if not did:
        raise ValueError(
            "DID is required."
        )

    return _request(
        "GET",
        f"/wallets/{did}/balance",
    )


# ------------------------------------------------------------
# SEND BLOCKCHAIN TRANSACTION
# ------------------------------------------------------------

def send_blockchain_transaction(
    did: str,
    recipient: str,
    amount,
):
    """
    Send a real blockchain transaction.

    The blockchain service handles the private key internally.
    """

    if not did:
        raise ValueError(
            "DID is required."
        )

    if not recipient:
        raise ValueError(
            "Recipient is required."
        )

    if amount is None or amount == "":
        raise ValueError(
            "Amount is required."
        )

    return _request(
        "POST",
        "/wallets/send-transaction",
        {
            "did": did,
            "recipient": recipient,
            "amount": str(amount),
        },
    )

def create_did_identity(
    did: str,
    kyc_hash: str,
):
    if not did:
        raise ValueError("DID is required.")

    if not kyc_hash:
        raise ValueError("KYC hash is required.")

    return _request(
        "POST",
        "/wallets/create-identity",
        {
            "did": did,
            "kycHash": kyc_hash,
        },
    )


def verify_did_identity(
    did: str,
    wallet_address: str,
):
    if not did:
        raise ValueError("DID is required.")

    if not wallet_address:
        raise ValueError("Wallet address is required.")

    return _request(
        "POST",
        "/wallets/verify-identity",
        {
            "did": did,
            "walletAddress": wallet_address,
        },
    )


# ------------------------------------------------------------
# DID STATUS
# ------------------------------------------------------------

def get_did_status(
    wallet_address: str,
):
    """
    Ask the blockchain API for the DIDRegistry status
    of a public wallet address.
    """

    if not wallet_address:
        raise ValueError(
            "Wallet address is required."
        )

    return _request(
        "GET",
        f"/did/status/{wallet_address}",
    )

def get_did_identity(
    wallet_address: str,
):
    if not wallet_address:
        raise ValueError("Wallet address is required.")

    return _request(
        "GET",
        f"/wallets/identity/{wallet_address}",
    )