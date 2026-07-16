from sqlalchemy.orm import Session
from app import models
import datetime

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email.lower()).first()

def create_user(db: Session, email: str, password_hash: str, role: str):
    db_user = models.User(
        email=email.lower(),
        password_hash=password_hash,
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_invite(db: Session, email: str, token: str, role: str, expires_in_days: int = 7):
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=expires_in_days)
    db_invite = models.InviteToken(
        email=email.lower(),
        token=token,
        role=role,
        is_used=False,
        expires_at=expires_at
    )
    db.add(db_invite)
    db.commit()
    db.refresh(db_invite)
    return db_invite

def get_invite_by_token(db: Session, token: str):
    return db.query(models.InviteToken).filter(models.InviteToken.token == token).first()

def mark_invite_used(db: Session, token: str):
    invite = get_invite_by_token(db, token)
    if invite:
        invite.is_used = True
        db.commit()
    return invite

def save_parsed_metrics(db: Session, metrics: list):
    sheets_to_clear = set(m["sheet"] for m in metrics)
    for sheet in sheets_to_clear:
        db.query(models.MetricValue).filter(models.MetricValue.sheet == sheet).delete()
    db_objects = [models.MetricValue(**m) for m in metrics]
    db.bulk_save_objects(db_objects)
    db.commit()
    return len(db_objects)

def get_unique_periods(db: Session):
    results = db.query(models.MetricValue.period).distinct().all()
    periods = [r[0] for r in results]
    def sort_key(p):
        try:
            datetime.datetime.strptime(p, "%Y-%m-%d")
            return (0, p)
        except ValueError:
            return (1, p)
    return sorted(periods, key=sort_key)

def get_unique_fiscal_years(db: Session):
    results = db.query(models.MetricValue.fiscal_year).distinct().all()
    return sorted([r[0] for r in results])

def get_metrics(db: Session, category: str = None, fiscal_year: str = None, period: str = None, metric_name: str = None):
    query = db.query(models.MetricValue)
    if category:
        query = query.filter(models.MetricValue.category == category)
    if fiscal_year:
        query = query.filter(models.MetricValue.fiscal_year == fiscal_year)
    if period:
        query = query.filter(models.MetricValue.period == period)
    if metric_name:
        query = query.filter(models.MetricValue.metric_name == metric_name)
    return query.all()
