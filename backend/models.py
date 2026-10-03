from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

# ============================================================
# AUTH
# ============================================================
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    employee_id: int
    full_name: str
    role: str
    access: list = []

# ============================================================
# EMPLOYEE
# ============================================================
class EmployeeCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = "employee"

class EmployeeResponse(BaseModel):
    employee_id: int
    username: str
    full_name: str
    email: Optional[str]
    phone: Optional[str]
    role: str
    is_active: bool
    last_login: Optional[datetime]

# ============================================================
# CLIENT
# ============================================================
class ClientCreate(BaseModel):
    afm: str
    last_name: str
    first_name: Optional[str] = None
    company_name: Optional[str] = None
    client_type: str = "individual"
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    amka: Optional[str] = None
    id_number: Optional[str] = None
    taxis_username: Optional[str] = None
    taxis_password: Optional[str] = None
    doy: Optional[str] = None
    profession: Optional[str] = None
    kad: Optional[str] = None
    notes: Optional[str] = None

class ClientUpdate(BaseModel):
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    company_name: Optional[str] = None
    client_type: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    doy: Optional[str] = None
    profession: Optional[str] = None
    kad: Optional[str] = None
    notes: Optional[str] = None
    afm: Optional[str] = None
    amka: Optional[str] = None
    taxis_username: Optional[str] = None
    taxis_password: Optional[str] = None

class ClientResponse(BaseModel):
    client_id: int
    last_name: str
    first_name: Optional[str]
    company_name: Optional[str]
    client_type: str
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    doy: Optional[str]
    profession: Optional[str]
    kad: Optional[str]
    notes: Optional[str]
    is_active: bool
    created_at: datetime

# ============================================================
# CLIENT SERVICE
# ============================================================
class ClientServiceCreate(BaseModel):
    service_id: int
    year: int
    period: str
    status: str = "pending"
    amount_billed: Optional[float] = None
    amount_paid: Optional[float] = 0.0
    due_date: Optional[date] = None
    notes: Optional[str] = None

class ClientServiceUpdate(BaseModel):
    status: Optional[str] = None
    amount_billed: Optional[float] = None
    amount_paid: Optional[float] = None
    due_date: Optional[date] = None
    completed_date: Optional[date] = None
    notes: Optional[str] = None

class ClientServiceResponse(BaseModel):
    client_id: int
    service_id: int
    service_name: str
    category: str
    year: int
    period: str
    status: str
    amount_billed: Optional[float]
    amount_paid: Optional[float]
    amount_remaining: Optional[float]
    due_date: Optional[date]
    completed_date: Optional[date]
    notes: Optional[str]



# ============================================================
# CLIENT_SERVICE_UPDATE
# ============================================================
class ClientServiceUpdate(BaseModel):
    amount_billed: Optional[float] = None
    amount_paid: Optional[float] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None


class EmployeeUpdate(BaseModel):
    username: str
    password: Optional[str] = None
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
