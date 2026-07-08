from sqlalchemy import Column, Integer, String, ForeignKey
from backend.database import Base

# ================= USER =================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)


# ================= TRANSACTION =================
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    txHash = Column(String)
    amount = Column(Integer)
    sender = Column(String)
    recipient = Column(String)
    status = Column(String)
    timestamp = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))


# ================= KYC =================
class KYC(Base):
    __tablename__ = "kyc"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    gov_id = Column(String)
    status = Column(String)

# =============== WALLET =================
class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    balance = Column(Integer, default=5000)

    wallet_address = Column(String, unique=True)
    did = Column(String, unique=True)
    blockchain = Column(String, default="Polygon")