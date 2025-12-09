import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Text, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

Base = declarative_base()

DB_PATH = os.getenv('PP_DB_PATH', '/data/plexusertracking.db')
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)

class EmailAccount(Base):
    __tablename__ = 'email_accounts'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    address = Column(String)
    imap_server = Column(String)
    imap_port = Column(Integer, default=993)
    password = Column(String)
    folder = Column(String, default='INBOX')
    search_term = Column(String, default='UNSEEN')
    type = Column(String, default='unknown')  # paypal|venmo|zelle or custom
    last_checked = Column(DateTime, nullable=True)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    plex_username = Column(String, unique=True)
    real_name = Column(String)
    emails = Column(String)  # pipe-separated
    venmo = Column(String)
    zelle = Column(String)
    billing_amount = Column(Float, default=0.0)
    billing_frequency = Column(String, default='monthly')  # monthly/quarterly/yearly/custom
    next_due = Column(DateTime, nullable=True)
    active = Column(Boolean, default=True)

class Payment(Base):
    __tablename__ = 'payments'
    id = Column(Integer, primary_key=True)
    service = Column(String)              # 'paypal', 'venmo', 'zelle', or account name
    amount = Column(Float, nullable=True)
    payer = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    sender = Column(String, nullable=True)
    date = Column(String, nullable=True)
    body = Column(Text, nullable=True)
    matched_user_id = Column(Integer, nullable=True)
    provider_txn = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Expense(Base):
    __tablename__ = 'expenses'
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    description = Column(String)
    category = Column(String, default='Misc')
    amount = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class Setting(Base):
    __tablename__ = 'settings'
    key = Column(String, primary_key=True)
    value = Column(String)

class Admin(Base):
    __tablename__ = 'admin'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(engine)
