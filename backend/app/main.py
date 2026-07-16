from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app import models, crud, auth
from app.routers import auth as auth_router, admin as admin_router, dashboard as dashboard_router, ppt as ppt_router
import os

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    admin_user = crud.get_user_by_email(db, "admin@company.com")
    if not admin_user:
        hashed_password = auth.get_password_hash("adminpassword")
        crud.create_user(
            db=db,
            email="admin@company.com",
            password_hash=hashed_password,
            role="admin"
        )
        print("Seeded default admin user: admin@company.com / adminpassword")
        
    # Seed sample.xlsx if it exists and database is empty of metrics
    existing_metrics = db.query(models.MetricValue).limit(1).all()
    if not existing_metrics:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sample_path = os.path.join(base_dir, "sample.xlsx")
        if os.path.exists(sample_path):
            print(f"Found sample.xlsx at {sample_path}. Parsing and seeding database...")
            from app.excel_parser import parse_excel_workbook
            metrics = parse_excel_workbook(sample_path)
            if metrics:
                inserted = crud.save_parsed_metrics(db, metrics)
                print(f"Successfully seeded {inserted} metrics on startup.")
            else:
                print("Failed to parse metrics from sample.xlsx.")
        else:
            print(f"sample.xlsx not found at {sample_path}. Skipping startup seeding.")
except Exception as e:
    print(f"Error seeding database on startup: {str(e)}")
finally:
    db.close()

app = FastAPI(
    title="Trainee Dashboard API",
    description="Python FastAPI backend serving structured Excel analysis data.",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
    "http://localhost:5173", 
    "http://localhost:8000",
    "*" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(admin_router.router)
app.include_router(dashboard_router.router)
app.include_router(ppt_router.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the Trainee Dashboard API. Access documentation at /docs"
    }