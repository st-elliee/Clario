from cryptography.fernet import Fernet
from dotenv import load_dotenv
import os

load_dotenv()

key = os.getenv("ENCRYPTION_KEY")
if not key:
    raise ValueError("ENCRYPTION_KEY δεν βρέθηκε στο .env")

fernet = Fernet(key.encode())

def encrypt(value: str) -> str:
    if not value:
        return value
    return fernet.encrypt(value.encode()).decode()

def decrypt(value: str) -> str:
    if not value:
        return value
    try:
        return fernet.decrypt(value.encode()).decode()
    except Exception:
        return value  # αν δεν είναι κρυπτογραφημένο, επέστρεψέ το ως έχει


import hashlib

def hash_afm(afm: str) -> str:
    if not afm:
        return afm
    return hashlib.sha256(afm.strip().encode()).hexdigest()