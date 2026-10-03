"""
Fake demo data for Clario.

Every person, company, ΑΦΜ, ΑΜΚΑ, phone number and amount here is invented.
ΑΦΜ and ΑΜΚΑ values are generated so that their check digit is WRONG,
which means none of them can be a valid real-world number.

Dates are generated relative to *today*, so the demo always shows upcoming
deadlines, notifications and current-month income, no matter when it runs.
The random generator is seeded, so the same day always produces the same data.

Usage (local):
    cd backend
    python -m db.seed          # drops all tables, recreates them, inserts demo data
"""
import calendar
import json
import os
import random
from datetime import date, datetime, timedelta

import bcrypt

from database import get_connection
from encryption import encrypt, hash_afm

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")
DEMO_PASSWORD = "demo1234"

MONTHS = ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος",
          "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"]

# ------------------------------------------------------------------
# Static reference data
# ------------------------------------------------------------------
EMPLOYEES = [
    # username, full name, role, email
    ("admin",    "Νίκος Αντωνίου",     "admin",    "admin@clario-demo.example"),
    ("employee", "Μαρία Κωνσταντίνου", "employee", "maria@clario-demo.example"),
    ("eleni.p",  "Ελένη Παππά",        "employee", "eleni@clario-demo.example"),
    ("kostas.d", "Κώστας Δημητρίου",   "employee", "kostas@clario-demo.example"),
    ("sofia.a",  "Σοφία Αλεξίου",      "employee", "sofia@clario-demo.example"),
    ("petros.g", "Πέτρος Γεωργίου",    "employee", "petros@clario-demo.example"),
]
# First names used by the "Διάφορα Έσοδα" report (must match frontend Reports.tsx)
MISC_EMPLOYEE_NAMES = ["Νίκος", "Μαρία", "Ελένη", "Κώστας", "Σοφία", "Πέτρος"]

SERVICES = [
    # id, name, category, description, recurring
    (1,  "Φορολογική Δήλωση Ε1",        "Φορολογία", "Ετήσια δήλωση εισοδήματος φυσικών προσώπων", True),
    (2,  "Πληρωμές Επιχειρήσεων",       "Λογιστικά", "Ετήσια αμοιβή τήρησης βιβλίων, εξοφλείται σε δόσεις", True),
    (3,  "ΦΠΑ Μηνιαίο",                 "Φορολογία", "Μηνιαία περιοδική δήλωση ΦΠΑ", True),
    (4,  "ΦΠΑ Τριμηνιαίο",              "Φορολογία", "Τριμηνιαία περιοδική δήλωση ΦΠΑ", True),
    (5,  "ΕΦΚΑ Ασφαλιστικές Εισφορές",  "Φορολογία", "Παρακολούθηση και πληρωμή εισφορών ΕΦΚΑ", True),
    (6,  "Μισθοδοσία Υπαλλήλων",        "Λογιστικά", "Μηνιαία κατάρτιση μισθοδοσίας και ΑΠΔ", True),
    (7,  "Δήλωση Ε9",                   "Φορολογία", "Δήλωση στοιχείων ακινήτων", False),
    (8,  "Έναρξη Επιχείρησης",          "Φορολογία", "Διαδικασία έναρξης εργασιών στην ΑΑΔΕ", False),
    (9,  "Διακοπή Επιχείρησης",         "Φορολογία", "Διαδικασία διακοπής εργασιών στην ΑΑΔΕ", False),
    (10, "Εκπροσώπηση ΑΑΔΕ",            "Άλλες",     "Εκπροσώπηση πελάτη στη ΔΟΥ", False),
    (11, "Ηλεκτρονικές Πληρωμές",       "Άλλες",     "Ρύθμιση πάγιων εντολών ΕΦΚΑ / ΑΑΔΕ", False),
    (12, "Μεταβολή Εταιρικής Μορφής",   "Άλλες",     "Μετατροπή ή λύση εταιρείας", False),
]

MALE_FIRST = ["Γιώργος", "Δημήτρης", "Γιάννης", "Κωνσταντίνος", "Παναγιώτης", "Βασίλης",
              "Χρήστος", "Θανάσης", "Μιχάλης", "Βαγγέλης", "Σπύρος", "Αντώνης", "Ηλίας",
              "Θοδωρής", "Στέλιος", "Απόστολος", "Παύλος", "Λευτέρης", "Αλέκος", "Στάθης"]
FEMALE_FIRST = ["Μαρία", "Ελένη", "Κατερίνα", "Βασιλική", "Αναστασία", "Ευαγγελία",
                "Δέσποινα", "Χριστίνα", "Γεωργία", "Ιωάννα", "Βούλα", "Αγγελική",
                "Δήμητρα", "Κωνσταντίνα", "Ζωή", "Φωτεινή", "Αλεξάνδρα", "Ειρήνη"]
SURNAMES = [  # (male form, female form)
    ("Παπαδόπουλος", "Παπαδοπούλου"), ("Οικονόμου", "Οικονόμου"), ("Βασιλείου", "Βασιλείου"),
    ("Νικολάου", "Νικολάου"), ("Ιωάννου", "Ιωάννου"), ("Μακρής", "Μακρή"),
    ("Καραγιάννης", "Καραγιάννη"), ("Αθανασίου", "Αθανασίου"), ("Χατζηδάκης", "Χατζηδάκη"),
    ("Λαμπρόπουλος", "Λαμπροπούλου"), ("Ζαχαρίου", "Ζαχαρίου"), ("Σταματόπουλος", "Σταματοπούλου"),
    ("Κυριακίδης", "Κυριακίδου"), ("Θεοδωρίδης", "Θεοδωρίδου"), ("Τσολάκης", "Τσολάκη"),
    ("Μαυρίδης", "Μαυρίδου"), ("Πετρίδης", "Πετρίδου"), ("Καλογεράκης", "Καλογεράκη"),
    ("Δημάκης", "Δημάκη"), ("Μουρατίδης", "Μουρατίδου"), ("Ευθυμίου", "Ευθυμίου"),
    ("Χριστοδούλου", "Χριστοδούλου"), ("Αναστασιάδης", "Αναστασιάδου"), ("Κοντός", "Κοντού"),
    ("Φωτίου", "Φωτίου"), ("Σαββίδης", "Σαββίδου"), ("Παπαθανασίου", "Παπαθανασίου"),
    ("Ρίζος", "Ρίζου"), ("Γκίκας", "Γκίκα"), ("Τζιόλας", "Τζιόλα"),
]
LATIN = {"Α": "a", "Ά": "a", "Β": "v", "Γ": "g", "Δ": "d", "Ε": "e", "Έ": "e", "Ζ": "z",
         "Η": "i", "Ή": "i", "Θ": "th", "Ι": "i", "Ί": "i", "Ϊ": "i", "Κ": "k", "Λ": "l",
         "Μ": "m", "Ν": "n", "Ξ": "x", "Ο": "o", "Ό": "o", "Π": "p", "Ρ": "r", "Σ": "s",
         "Τ": "t", "Υ": "y", "Ύ": "y", "Φ": "f", "Χ": "ch", "Ψ": "ps", "Ω": "o", "Ώ": "o"}

FREELANCER_JOBS = [
    ("Ηλεκτρολόγος", "4321.10.01"), ("Υδραυλικός", "4322.11.01"), ("Δικηγόρος", "6910.10.01"),
    ("Γραφίστας", "7410.11.01"), ("Φυσικοθεραπευτής", "8690.13.01"), ("Πολιτικός Μηχανικός", "7112.11.01"),
    ("Προγραμματιστής", "6201.11.01"), ("Φωτογράφος", "7420.11.01"), ("Μεταφραστής", "7430.10.01"),
    ("Οδοντίατρος", "8623.11.01"), ("Αρχιτέκτονας", "7111.10.01"), ("Κομμωτής", "9602.11.01"),
    ("Γυμναστής", "8551.10.01"), ("Ψυχολόγος", "8690.17.01"),
]
COMPANIES = [
    ("Αστέρι Τροφίμων Ι.Κ.Ε.", "Χονδρεμπόριο τροφίμων", "4639.10.00"),
    ("Δέλτα Ηλεκτρολογικά Ο.Ε.", "Ηλεκτρολογικές εγκαταστάσεις", "4321.10.01"),
    ("Κυανό Ψηφιακές Λύσεις Ι.Κ.Ε.", "Ανάπτυξη λογισμικού", "6201.11.01"),
    ("Μέλισσα Αρτοποιία Ε.Ε.", "Αρτοποιία", "1071.10.01"),
    ("Πλάτανος Καφέ Ο.Ε.", "Καφετέρια", "5630.10.01"),
    ("Ορίζων Μεταφορική Ι.Κ.Ε.", "Οδικές μεταφορές", "4941.10.00"),
    ("Αλκυόνη Τουριστική Μ.Ι.Κ.Ε.", "Τουριστικό γραφείο", "7911.10.00"),
    ("Πυξίδα Μελετητική Ι.Κ.Ε.", "Τεχνικές μελέτες", "7112.11.01"),
    ("Σταγόνα Υδραυλικά Ο.Ε.", "Υδραυλικές εγκαταστάσεις", "4322.11.01"),
    ("Ελαιώνας Τροφίμων Α.Ε.", "Τυποποίηση ελαιολάδου", "1041.10.00"),
    ("Κύμα Ναυτικά Είδη Ε.Ε.", "Λιανικό εμπόριο", "4778.90.00"),
    ("Γέφυρα Συμβουλευτική Ι.Κ.Ε.", "Συμβουλευτικές υπηρεσίες", "7022.10.00"),
    ("Φάρος Εκτυπώσεις Ο.Ε.", "Εκτυπώσεις", "1812.19.00"),
    ("Ανεμώνη Ανθοπωλείο Ε.Ε.", "Ανθοπωλείο", "4776.10.01"),
    ("Τρίγωνο Αρχιτεκτονική Ι.Κ.Ε.", "Αρχιτεκτονικές υπηρεσίες", "7111.10.01"),
    ("Λιμάνι Εστίαση Ο.Ε.", "Εστιατόριο", "5610.10.01"),
]
STREETS = ["Εγνατία", "Τσιμισκή", "Μητροπόλεως", "Ερμού", "Αγίας Σοφίας", "Βασ. Όλγας",
           "Δελφών", "Κωνσταντινουπόλεως", "Λαγκαδά", "Μοναστηρίου", "Παπαναστασίου",
           "Ανθέων", "Πόντου", "Γ. Παπανδρέου", "Ολυμπιάδος", "Κασσάνδρου", "Αγγελάκη"]
AREAS = ["Θεσσαλονίκη", "Καλαμαριά", "Πυλαία", "Εύοσμος", "Νεάπολη", "Τριανδρία", "Πανόραμα"]
DOY_INDIVIDUAL = ["ΔΟΥ Α' Θεσσαλονίκης", "ΔΟΥ Δ' Θεσσαλονίκης", "ΔΟΥ Ε' Θεσσαλονίκης",
                  "ΔΟΥ Καλαμαριάς", "ΔΟΥ Αμπελοκήπων", "ΔΟΥ Ιωνίας Θεσσαλονίκης"]
DOY_COMPANY = ["ΔΟΥ Φ.Α.Ε. Θεσσαλονίκης", "ΔΟΥ Δ' Θεσσαλονίκης", "ΔΟΥ Καλαμαριάς"]
MISC_DESCRIPTIONS = ["Πιστοποιητικό φορολογικής ενημερότητας", "Εκτύπωση εκκαθαριστικού",
                     "Αίτηση επιδόματος", "Μεταβολή στοιχείων Taxis", "Μισθωτήριο συμβόλαιο",
                     "Ασφαλιστική ενημερότητα", "Υπεύθυνη δήλωση", "Κλειδάριθμος Taxisnet",
                     "Βεβαίωση αποδοχών", "Αίτηση ρύθμισης οφειλών"]
CLIENT_NOTES = [None, None, None, None, "Προτιμά επικοινωνία με email",
                "Φέρνει τα παραστατικά στο τέλος του μήνα", "Έχει ενοίκια (Ε2)",
                "Συνεργασία από σύσταση", "Να καλείται πριν τις 14:00"]


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def fake_afm(rng: random.Random) -> str:
    """9 digits whose check digit is deliberately wrong (never a real ΑΦΜ)."""
    digits = [rng.randint(0, 9) for _ in range(8)]
    digits[0] = rng.randint(0, 1)
    check = sum(d * 2 ** (8 - i) for i, d in enumerate(digits)) % 11 % 10
    return "".join(map(str, digits)) + str((check + rng.randint(1, 9)) % 10)


def fake_amka(rng: random.Random, birth: date) -> str:
    """11 digits (ddmmyy + 5) that fail the Luhn check (never a real ΑΜΚΑ)."""
    base = birth.strftime("%d%m%y") + "".join(str(rng.randint(0, 9)) for _ in range(4))
    for last in range(10):
        candidate = base + str(last)
        total = 0
        for i, ch in enumerate(reversed(candidate)):
            d = int(ch)
            if i % 2 == 1:
                d *= 2
                d -= 9 if d > 9 else 0
            total += d
        if total % 10 != 0:
            return candidate
    return base + "0"


def latin(text: str) -> str:
    text = text.upper().replace("ΟΥ", "U").replace("ΟΎ", "U")
    return "".join(LATIN.get(ch, "ou" if ch == "U" else ch.lower()) for ch in text if ch.isalpha())


def last_day(year: int, month: int) -> date:
    return date(year, month, calendar.monthrange(year, month)[1])


def add_months(d: date, n: int) -> date:
    m = d.month - 1 + n
    y = d.year + m // 12
    m = m % 12 + 1
    return date(y, m, min(d.day, calendar.monthrange(y, m)[1]))


def at(d: date, rng: random.Random) -> datetime:
    return datetime(d.year, d.month, d.day, rng.randint(8, 16), rng.randint(0, 59), rng.randint(0, 59))


def rand_date(rng: random.Random, start: date, end: date) -> date:
    if end <= start:
        return start
    return start + timedelta(days=rng.randint(0, (end - start).days))


# ------------------------------------------------------------------
# Data generation
# ------------------------------------------------------------------
def build(today: date | None = None) -> dict:
    today = today or date.today()
    rng = random.Random(today.toordinal())
    Y = today.year
    staff_ids = [2, 3, 4, 5, 6]          # employees (admin is 1)
    anyone = [1] + staff_ids

    data = {k: [] for k in ("employee", "service", "client", "client_service",
                            "client_payment", "misc_income", "action")}

    # --- employees -------------------------------------------------
    pw_hash = bcrypt.hashpw(DEMO_PASSWORD.encode(), bcrypt.gensalt(rounds=10)).decode()
    for i, (username, full_name, role, email) in enumerate(EMPLOYEES, start=1):
        data["employee"].append({
            "employee_id": i, "username": username, "password_hash": pw_hash,
            "full_name": full_name, "email": email, "phone": f"2310000{100 + i}",
            "role": role, "is_active": True,
            "last_login": at(today - timedelta(days=rng.randint(0, 6)), rng),
            "created_at": datetime(Y - 3, 9, 1, 9, 0),
        })

    # --- services --------------------------------------------------
    for sid, name, cat, desc, rec in SERVICES:
        data["service"].append({"service_id": sid, "name": name, "category": cat,
                                "description": desc, "is_recurring": rec, "is_active": True})

    # --- clients ---------------------------------------------------
    used_names, clients = set(), []

    def person():
        while True:
            female = rng.random() < 0.5
            first = rng.choice(FEMALE_FIRST if female else MALE_FIRST)
            sur = rng.choice(SURNAMES)[1 if female else 0]
            if (first, sur) not in used_names:
                used_names.add((first, sur))
                return first, sur

    def address():
        return f"{rng.choice(STREETS)} {rng.randint(1, 180)}, {rng.choice(AREAS)}"

    kinds = ["individual"] * 34 + ["freelancer"] * 18 + ["company"] * len(COMPANIES)
    rng.shuffle(kinds)
    company_pool = COMPANIES[:]
    rng.shuffle(company_pool)
    job_pool = FREELANCER_JOBS[:]

    for cid, kind in enumerate(kinds, start=1):
        first, sur = person()
        birth = date(rng.randint(1955, 2000), rng.randint(1, 12), rng.randint(1, 28))
        afm = fake_afm(rng)
        c = {
            "client_id": cid, "client_type": kind, "last_name": sur, "first_name": first,
            "company_name": None, "afm_plain": afm,
            "phone": f"690000{rng.randint(1000, 9999)}",
            "email": f"{latin(first)}.{latin(sur)}@example.com" if rng.random() < 0.7 else None,
            "address": address(), "doy": rng.choice(DOY_INDIVIDUAL),
            "profession": None, "kad": None, "notes": rng.choice(CLIENT_NOTES),
            "amka_plain": fake_amka(rng, birth) if kind != "company" else None,
            "id_plain": f"Α{rng.choice('ΒΕΖΗΙΚΜΝΟΡΤΥΧ')} {rng.randint(100000, 999999)}" if kind != "company" else None,
            "taxis_user_plain": None, "taxis_pass_plain": None,
            "created_by": rng.choice(anyone),
        }
        if kind == "freelancer":
            c["profession"], c["kad"] = rng.choice(job_pool)
        if kind == "company":
            name, prof, kad = company_pool.pop()
            c.update(company_name=name, last_name=name, first_name=None,
                     profession=prof, kad=kad, doy=rng.choice(DOY_COMPANY),
                     phone=f"2310000{rng.randint(200, 999)}",
                     email=f"info@{latin(name.split()[0])}.example")
        if rng.random() < 0.6:
            base = latin(c["company_name"].split()[0] if c["company_name"] else sur)[:8]
            c["taxis_user_plain"] = f"{base}{rng.randint(10, 99)}"
            c["taxis_pass_plain"] = f"Demo-{rng.randint(1000, 9999)}!"
        clients.append(c)

    # creation dates: most clients are old, the last few are recent
    for c in clients:
        c["created_at"] = at(rand_date(rng, date(Y - 3, 1, 10), today - timedelta(days=200)), rng)
    for c in rng.sample(clients, 6):
        c["created_at"] = at(today - timedelta(days=rng.randint(0, 40)), rng)

    for c in clients:
        data["client"].append({
            "client_id": c["client_id"], "afm": encrypt(c["afm_plain"]), "afm_hash": hash_afm(c["afm_plain"]),
            "last_name": c["last_name"], "first_name": c["first_name"], "company_name": c["company_name"],
            "client_type": c["client_type"], "phone": c["phone"], "email": c["email"],
            "address": c["address"],
            "amka": encrypt(c["amka_plain"]) if c["amka_plain"] else None,
            "id_number": encrypt(c["id_plain"]) if c["id_plain"] else None,
            "taxis_username": encrypt(c["taxis_user_plain"]) if c["taxis_user_plain"] else None,
            "taxis_password": encrypt(c["taxis_pass_plain"]) if c["taxis_pass_plain"] else None,
            "doy": c["doy"], "profession": c["profession"], "kad": c["kad"], "notes": c["notes"],
            "is_active": True, "created_by": c["created_by"], "created_at": c["created_at"],
        })

    persons = [c for c in clients if c["client_type"] != "company"]
    companies = [c for c in clients if c["client_type"] == "company"]
    freelancers = [c for c in clients if c["client_type"] == "freelancer"]
    cs_rows = data["client_service"]

    def add_cs(client, sid, year, period, status, billed, paid, due, created, by=None, notes=None):
        completed = None
        if status == "completed":
            completed = min(due, created.date() + timedelta(days=rng.randint(0, 20))) if due else created.date()
            completed = max(completed, created.date())
        cs_rows.append({
            "client_id": client["client_id"], "service_id": sid, "year": year, "period": period,
            "status": status, "payment_status": "paid" if billed and paid >= billed else "unpaid",
            "amount_billed": billed, "amount_paid": paid, "due_date": due, "completed_date": completed,
            "notes": notes, "created_by": by or rng.choice(staff_ids),
            "updated_by": None, "created_at": created,
        })

    # --- Ε1 tax declarations (service 1) ----------------------------
    def declarations(filing_year: int, done_ratio: float, coverage: float, full_pay: float):
        season_start = date(filing_year, 3, 16)
        season_end = min(date(filing_year, 7, 15), today)
        if season_end < season_start:
            return
        for c in persons:
            if c["created_at"].date() > season_end or rng.random() > coverage:
                continue
            created = at(rand_date(rng, season_start, season_end), rng)
            billed = float(rng.choice([30, 35, 40, 45, 50, 60]) if c["client_type"] == "individual"
                           else rng.choice([80, 90, 100, 120, 150]))
            done = rng.random() < done_ratio
            r = rng.random()
            paid = billed if (done and r < full_pay) else (round(billed / 2) if r < 0.9 else 0.0)
            add_cs(c, 1, filing_year - 1, "Ετήσιο", "completed" if done else "pending",
                   billed, float(paid), date(filing_year, 7, 15), created,
                   notes=None if done else rng.choice(["Λείπουν βεβαιώσεις αποδοχών", "Αναμονή για ενοίκια",
                                                       "Εκκρεμεί υπογραφή συζύγου", None]))

    declarations(Y - 1, 1.0, 0.95, 0.96)                                  # last season: all filed
    declarations(Y, 0.95 if today > date(Y, 7, 15) else 0.6, 0.88, 0.82)  # this season

    # --- Πληρωμές Επιχειρήσεων (service 2) + instalments ------------
    payers = companies + rng.sample(freelancers, min(6, len(freelancers)))
    for c in payers:
        fee = float(rng.choice(range(600, 2500, 100)))
        for year in (Y - 1, Y):
            created = at(date(year, 1, rng.randint(2, 15)), rng)
            if created.date() > today:
                continue
            n = rng.choice([3, 4, 6])
            installments = [round(fee / n, 2)] * n
            if year == Y:
                # only instalments whose date has passed, sometimes fewer
                dates = [date(Y, 1 + i * (12 // n), rng.randint(5, 25)) for i in range(n)]
                pairs = [(a, d) for a, d in zip(installments, dates) if d <= today]
                if pairs and rng.random() < 0.35:
                    pairs = pairs[:-1]
            else:
                dates = [date(year, 1 + i * (12 // n), rng.randint(5, 25)) for i in range(n)]
                pairs = list(zip(installments, dates))
                if rng.random() < 0.15:
                    pairs = pairs[:-1]
            paid = round(sum(a for a, _ in pairs), 2)
            if paid >= fee - 0.05:
                paid = fee
            add_cs(c, 2, year, "Ετήσιο", "completed" if year < Y else "in_progress",
                   fee, paid, date(year, 12, 31), created, by=1)
            for amount, d in pairs:
                data["client_payment"].append({
                    "client_id": c["client_id"], "service_id": 2, "year": year, "amount": amount,
                    "payment_date": d, "notes": rng.choice([None, None, "Μετρητά", "Τραπεζική κατάθεση", "POS"]),
                    "created_by": rng.choice(anyone), "created_at": at(d, rng),
                })

    # --- recurring monthly / quarterly work ------------------------
    months_back = [add_months(date(today.year, today.month, 1), -k) for k in range(9, 0, -1)]

    def monthly(clients_, sid, amounts):
        for c in clients_:
            amount = float(rng.choice(amounts))
            for m in months_back:
                if m < c["created_at"].date().replace(day=1):
                    continue
                period = MONTHS[m.month - 1]
                work_month = add_months(m, 1)
                due = last_day(work_month.year, work_month.month)
                created = at(min(today, date(work_month.year, work_month.month, rng.randint(1, 10))), rng)
                if due < today:
                    add_cs(c, sid, m.year, period, "completed", amount,
                           amount if rng.random() < 0.9 else 0.0, due, created)
                else:
                    due = today + timedelta(days=rng.randint(1, 6))
                    add_cs(c, sid, m.year, period, rng.choice(["pending", "in_progress"]), amount,
                           amount if rng.random() < 0.4 else 0.0, due, created)

    vat_monthly = rng.sample(companies, 8)
    monthly(vat_monthly, 3, [50, 60, 70, 80])
    monthly(rng.sample(companies, 6), 6, [120, 150, 180, 220, 280])
    efka = rng.sample(freelancers, 10)
    for c in efka:
        for m in months_back[-3:]:
            period = MONTHS[m.month - 1]
            due = last_day(add_months(m, 1).year, add_months(m, 1).month)
            created = at(min(today, add_months(m, 1).replace(day=rng.randint(1, 8))), rng)
            if due < today:
                add_cs(c, 5, m.year, period, "completed", 25.0, 25.0, due, created)
            else:
                add_cs(c, 5, m.year, period, "pending", 25.0, 0.0,
                       today + timedelta(days=rng.randint(1, 6)), created)

    # quarterly VAT for some freelancers and the companies without monthly VAT
    quarterly = [c for c in companies if c not in vat_monthly] + rng.sample(freelancers, 5)
    q_ends = sorted({last_day(m.year, ((m.month - 1) // 3) * 3 + 3) for m in months_back})
    for c in quarterly:
        amount = float(rng.choice([60, 80, 100]))
        for q_end in q_ends:
            if q_end > today:
                continue
            q_label = f"Q{(q_end.month - 1) // 3 + 1}"
            due_month = add_months(q_end.replace(day=1), 1)
            due = last_day(due_month.year, due_month.month)
            created = at(min(today, due_month.replace(day=rng.randint(1, 12))), rng)
            if due < today:
                add_cs(c, 4, q_end.year, q_label, "completed", amount, amount, due, created)
            else:
                add_cs(c, 4, q_end.year, q_label, "in_progress", amount, 0.0,
                       today + timedelta(days=rng.randint(2, 7)), created)

    # a few overdue items (completed work recently past due, turned overdue)
    recent_done = [r for r in cs_rows if r["service_id"] in (3, 4, 5, 6) and r["status"] == "completed"
                   and r["due_date"] and today - timedelta(days=40) <= r["due_date"] < today]
    for r in rng.sample(recent_done, min(4, len(recent_done))):
        r.update(status="overdue", completed_date=None, amount_paid=0.0, payment_status="unpaid",
                 notes=rng.choice(["Δεν έχουν σταλεί τα τιμολόγια", "Αναμονή στοιχείων από πελάτη",
                                   "Εκκρεμεί πληρωμή ΦΠΑ"]))

    # --- one-off services, spread over the last 70 days ------------
    one_offs = [(7, [40, 50]), (8, [150, 200]), (9, [120]), (10, [80, 100]), (11, [30]), (12, [350, 450])]
    for _ in range(22):
        sid, prices = rng.choice(one_offs)
        c = rng.choice(companies if sid == 12 else clients)
        created_day = today - timedelta(days=rng.randint(0, 70))
        price = float(rng.choice(prices))
        due = created_day + timedelta(days=rng.randint(10, 30))
        if due < today:
            status, paid = "completed", price if rng.random() < 0.85 else 0.0
        else:
            status = rng.choice(["pending", "in_progress", "completed"])
            paid = price if status == "completed" or rng.random() < 0.3 else 0.0
        period = "Ετήσιο" if sid == 7 else MONTHS[created_day.month - 1]
        if any(r["client_id"] == c["client_id"] and r["service_id"] == sid and r["year"] == created_day.year
               and r["period"] == period for r in cs_rows):
            continue
        add_cs(c, sid, created_day.year, period, status, price, paid, due, at(created_day, rng))

    # --- misc income -----------------------------------------------
    for _ in range(45):
        d = rand_date(rng, date(Y - 1, 1, 1), today)
        data["misc_income"].append({
            "amount": float(rng.choice([10, 15, 20, 25, 30, 40, 50, 80])),
            "employee_name": rng.choice(MISC_EMPLOYEE_NAMES),
            "description": rng.choice(MISC_DESCRIPTIONS), "income_date": d,
            "created_by": 1, "created_at": at(d, rng),
        })

    # --- audit log (last two weeks) ----------------------------------
    stamps = set()
    for _ in range(70):
        emp = rng.choice(anyone)
        c = rng.choice(clients)
        kind = rng.choices(["edit_client", "add_service", "update_service", "edit_service", "add_client"],
                           weights=[4, 3, 5, 3, 1])[0]
        details = None
        if kind in ("add_service", "edit_service"):
            details = {"service_id": rng.choice([1, 3, 5, 6, 7]), "year": Y,
                       "period": MONTHS[today.month - 1]}
        elif kind == "update_service":
            details = {"service_id": rng.choice([1, 3, 4, 6]),
                       "new_status": rng.choice(["completed", "in_progress"])}
        ts = datetime.combine(today - timedelta(days=rng.randint(0, 14)), datetime.min.time()) + \
            timedelta(hours=rng.randint(8, 16), minutes=rng.randint(0, 59), seconds=rng.randint(0, 59),
                      microseconds=rng.randint(0, 999999))
        if (emp, ts) in stamps:
            continue
        stamps.add((emp, ts))
        data["action"].append({
            "employee_id": emp, "timestamp": ts, "action_type": kind, "client_id": c["client_id"],
            "details": json.dumps(details, ensure_ascii=False) if details else None,
            "ip_address": "127.0.0.1",
        })

    for r in cs_rows:
        r["amount_paid"] = round(float(r["amount_paid"]), 2)
        r["payment_status"] = "paid" if r["amount_billed"] and r["amount_paid"] >= r["amount_billed"] else "unpaid"
    return data


# ------------------------------------------------------------------
# Database
# ------------------------------------------------------------------
def _statements(sql: str):
    lines = [ln for ln in sql.splitlines() if not ln.strip().startswith("--")]
    for stmt in "\n".join(lines).split(";"):
        if stmt.strip():
            yield stmt.strip()


def _insert(cursor, table: str, rows: list):
    if not rows:
        return
    cols = list(rows[0].keys())
    sql = f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join(['%s'] * len(cols))})"
    cursor.executemany(sql, [tuple(r[c] for c in cols) for r in rows])


def reset_database(today: date | None = None) -> dict:
    data = build(today)
    conn = get_connection()
    if not conn:
        raise RuntimeError("Could not connect to the database")
    try:
        cursor = conn.cursor()
        with open(SCHEMA_PATH, encoding="utf-8") as f:
            for stmt in _statements(f.read()):
                cursor.execute(stmt)
        for table in ("employee", "service", "client", "client_service",
                      "client_payment", "misc_income", "action"):
            _insert(cursor, table, data[table])
        conn.commit()
        cursor.close()
        return {t: len(rows) for t, rows in data.items()}
    finally:
        conn.close()


if __name__ == "__main__":
    counts = reset_database()
    print("Demo data loaded:", counts)
    print(f"Log in with admin / {DEMO_PASSWORD}  or  employee / {DEMO_PASSWORD}")
