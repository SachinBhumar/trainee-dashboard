from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Request
from sqlalchemy.orm import Session
import secrets
import os
import shutil
from app.database import get_db
from app import crud, schemas, auth, models
from app.excel_parser import parse_excel_workbook
from urllib.parse import urlparse

router = APIRouter(prefix="/api/admin", tags=["Admin Actions"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

@router.post("/create-invite", response_model=schemas.InviteResponse, dependencies=[Depends(auth.get_admin_user)])
def create_invite(payload: schemas.InviteCreate, request: Request, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_email(db, payload.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email is already registered"
        )
        
    token = secrets.token_urlsafe(32)
    invite = crud.create_invite(
        db=db,
        email=payload.email,
        token=token,
        role=payload.role.lower()
    )
    
    # Try to determine the frontend base URL dynamically from Origin or Referer headers,
    # falling back to the FRONTEND_URL environment variable if not present.
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    
    if origin:
        frontend_base = origin
    elif referer:
        parsed_ref = urlparse(referer)
        frontend_base = f"{parsed_ref.scheme}://{parsed_ref.netloc}"
    else:
        frontend_base = FRONTEND_URL
        
    invite_url = f"{frontend_base}/register?token={token}"
    return {
        "email": invite.email,
        "token": invite.token,
        "role": invite.role,
        "invite_url": invite_url,
        "expires_at": invite.expires_at
    }

@router.post("/upload", status_code=status.HTTP_201_CREATED, dependencies=[Depends(auth.get_admin_user)])
def upload_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be in Excel (.xlsx or .xls) format"
        )
        
    # Standard path in VS Code
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    temp_dir = os.path.join(base_dir, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, f"temp_{secrets.token_hex(4)}.xlsx")
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        metrics = parse_excel_workbook(temp_file_path)
        if not metrics:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No metrics could be parsed. Verify Excel structure."
            )
            
        inserted_count = crud.save_parsed_metrics(db, metrics)
        
        active_sample_path = os.path.join(base_dir, "sample.xlsx")
        shutil.copy(temp_file_path, active_sample_path)
        
        return {
            "message": "Excel file uploaded successfully",
            "metrics_count": inserted_count,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)