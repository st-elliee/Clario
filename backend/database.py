import os
import tempfile

import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()


def _ssl_options() -> dict:
    """SSL settings for hosted MySQL (e.g. Aiven).

    DB_CA_CERT holds the CA certificate text. mysql-connector needs a file
    path, so the certificate is written once to a temp file.
    """
    ca_text = os.getenv("DB_CA_CERT")
    if not ca_text:
        return {}
    path = os.path.join(tempfile.gettempdir(), "clario-db-ca.pem")
    if not os.path.exists(path):
        with open(path, "w") as f:
            f.write(ca_text.replace("\\n", "\n"))
    return {"ssl_ca": path, "ssl_verify_cert": True}


def get_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            database=os.getenv("DB_NAME", "clario"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            **_ssl_options(),
        )
        return connection
    except Error as e:
        print(f"Σφάλμα σύνδεσης με τη βάση: {e}")
        return None


def test_connection():
    conn = get_connection()
    if conn and conn.is_connected():
        print("✅ Σύνδεση με τη βάση επιτυχής!")
        conn.close()
    else:
        print("❌ Αποτυχία σύνδεσης με τη βάση.")
