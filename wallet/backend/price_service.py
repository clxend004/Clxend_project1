"""
VECTRO cryptocurrency price service.

This service retrieves:
    1. ETH price in USD from Coinbase
    2. USD to INR exchange rate from Frankfurter
    3. Calculates the ETH/INR price

It is separate from the blockchain wallet integration.

Blockchain integration:
    backend/blockchain_service.py

Market price integration:
    backend/price_service.py
"""

import requests


ETH_PRICE_API_URL = (
    "https://api.coinbase.com/v2/prices/ETH-USD/spot"
)

USD_INR_API_URL = (
    "https://api.frankfurter.dev/v2/rate/usd/inr"
)

PRICE_TIMEOUT = 10


def get_eth_usd_price():
    """
    Get the current Ethereum price in USD from Coinbase.

    Returns:
        {
            "symbol": "ETH",
            "currency": "USD",
            "price": <ETH price in USD>
        }
    """

    try:
        response = requests.get(
            ETH_PRICE_API_URL,
            timeout=PRICE_TIMEOUT,
        )
    except requests.RequestException as error:
        raise RuntimeError(
            f"Unable to retrieve ETH/USD price: {error}"
        ) from error

    if response.status_code != 200:
        raise RuntimeError(
            "ETH/USD price service returned "
            f"HTTP {response.status_code}"
        )

    try:
        data = response.json()
    except ValueError as error:
        raise RuntimeError(
            "ETH/USD price service returned invalid JSON."
        ) from error

    price = (
        data.get("data", {})
        .get("amount")
    )

    if price is None:
        raise RuntimeError(
            "ETH/USD price was not returned."
        )

    try:
        price = float(price)
    except (TypeError, ValueError) as error:
        raise RuntimeError(
            "ETH/USD price returned by Coinbase is invalid."
        ) from error

    if price < 0:
        raise RuntimeError(
            "ETH/USD price cannot be negative."
        )

    return {
        "symbol": "ETH",
        "currency": "USD",
        "price": price,
    }


def get_usd_inr_rate():
    """
    Get the current USD to INR exchange rate
    from Frankfurter.

    Returns:
        {
            "base": "USD",
            "quote": "INR",
            "rate": <USD/INR rate>
        }
    """

    try:
        response = requests.get(
            USD_INR_API_URL,
            timeout=PRICE_TIMEOUT,
        )
    except requests.RequestException as error:
        raise RuntimeError(
            f"Unable to retrieve USD/INR rate: {error}"
        ) from error

    if response.status_code != 200:
        raise RuntimeError(
            "USD/INR price service returned "
            f"HTTP {response.status_code}"
        )

    try:
        data = response.json()
    except ValueError as error:
        raise RuntimeError(
            "USD/INR price service returned invalid JSON."
        ) from error

    rate = data.get("rate")

    if rate is None:
        raise RuntimeError(
            "USD/INR rate was not returned."
        )

    try:
        rate = float(rate)
    except (TypeError, ValueError) as error:
        raise RuntimeError(
            "USD/INR rate returned by Frankfurter is invalid."
        ) from error

    if rate <= 0:
        raise RuntimeError(
            "USD/INR rate must be greater than zero."
        )

    return {
        "base": "USD",
        "quote": "INR",
        "rate": rate,
    }


def get_eth_inr_price():
    """
    Calculate the current Ethereum price in Indian Rupees.

    Formula:

        ETH/USD × USD/INR = ETH/INR

    Returns:
        {
            "symbol": "ETH",
            "currency": "INR",
            "price": <ETH price in INR>,
            "ethUsdPrice": <ETH price in USD>,
            "usdInrRate": <USD to INR rate>
        }
    """

    eth_usd_data = get_eth_usd_price()
    usd_inr_data = get_usd_inr_rate()

    eth_usd_price = eth_usd_data["price"]
    usd_inr_rate = usd_inr_data["rate"]

    eth_inr_price = (
        eth_usd_price * usd_inr_rate
    )

    return {
        "symbol": "ETH",
        "currency": "INR",
        "price": eth_inr_price,
        "ethUsdPrice": eth_usd_price,
        "usdInrRate": usd_inr_rate,
    }


def calculate_inr_value(
    eth_balance,
    eth_inr_price,
):
    """
    Convert an ETH wallet balance to its INR equivalent.

    Formula:

        ETH balance × ETH/INR price = INR value
    """

    try:
        eth = float(eth_balance)
        price = float(eth_inr_price)
    except (TypeError, ValueError) as error:
        raise ValueError(
            "Invalid ETH balance or ETH/INR price."
        ) from error

    if eth < 0:
        raise ValueError(
            "ETH balance cannot be negative."
        )

    if price < 0:
        raise ValueError(
            "ETH/INR price cannot be negative."
        )

    return eth * price