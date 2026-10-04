import os
import requests
from dotenv import load_dotenv


# ============================================================
# EMAIL CONFIGURATION
# ============================================================

load_dotenv(
    dotenv_path=os.path.join(
        os.path.dirname(__file__),
        ".env",
    )
)

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM")


# ============================================================
# SEND EMAIL
# ============================================================

def send_email(
    to_email: str,
    subject: str,
    html_content: str,
) -> bool:
    """
    Send an email using the Resend API.

    Returns:
        True  -> email sent successfully
        False -> email could not be sent
    """

    if not RESEND_API_KEY:
        print("ERROR: RESEND_API_KEY is not configured.")
        return False

    if not EMAIL_FROM:
        print("ERROR: EMAIL_FROM is not configured.")
        return False

    if not to_email:
        print("ERROR: Recipient email address is missing.")
        return False

    url = "https://api.resend.com/emails"

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "from": EMAIL_FROM,
        "to": [to_email],
        "subject": subject,
        "html": html_content,
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=15,
        )

        if 200 <= response.status_code < 300:
            print(f"EMAIL SENT SUCCESSFULLY TO: {to_email}")
            return True

        print(
            "EMAIL SEND FAILED:",
            response.status_code,
            response.text,
        )
        return False

    except requests.RequestException as error:
        print("EMAIL SEND ERROR:", error)
        return False


# ============================================================
# GOOGLE LOGIN OTP EMAIL
# ============================================================

def send_google_login_otp(
    to_email: str,
    otp: str,
) -> bool:
    """
    Send the verification code used during Google login.
    """

    subject = "CLXEND Google Login Verification Code"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CLXEND Verification Code</title>
    </head>

    <body
        style="
            margin: 0;
            padding: 0;
            background-color: #0b1120;
            font-family: Arial, Helvetica, sans-serif;
        "
    >

        <div
            style="
                max-width: 520px;
                margin: 40px auto;
                padding: 30px;
                background: #111827;
                border-radius: 16px;
                border: 1px solid #273449;
                color: #f8fafc;
            "
        >

            <h2
                style="
                    margin-top: 0;
                    margin-bottom: 10px;
                    color: #ffffff;
                "
            >
                CLXEND
            </h2>

            <p
                style="
                    color: #94a3b8;
                    font-size: 14px;
                "
            >
                Google login verification
            </p>

            <p
                style="
                    color: #e2e8f0;
                    font-size: 15px;
                    line-height: 1.6;
                "
            >
                Someone is signing in to your CLXEND wallet using
                Google authentication.
            </p>

            <p
                style="
                    color: #e2e8f0;
                    font-size: 15px;
                    line-height: 1.6;
                "
            >
                Enter the following verification code to continue:
            </p>

            <div
                style="
                    margin: 25px 0;
                    padding: 18px;
                    text-align: center;
                    background: #0b1120;
                    border: 1px solid #334155;
                    border-radius: 12px;
                "
            >
                <span
                    style="
                        font-size: 32px;
                        font-weight: 800;
                        letter-spacing: 8px;
                        color: #60a5fa;
                    "
                >
                    {otp}
                </span>
            </div>

            <p
                style="
                    color: #94a3b8;
                    font-size: 13px;
                    line-height: 1.6;
                "
            >
                This verification code expires in 5 minutes.
                Do not share this code with anyone.
            </p>

            <p
                style="
                    color: #64748b;
                    font-size: 12px;
                    margin-top: 25px;
                "
            >
                If you did not attempt to sign in to CLXEND,
                you can safely ignore this email.
            </p>

        </div>

    </body>
    </html>
    """

    return send_email(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
    )