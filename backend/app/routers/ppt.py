from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import auth, models
from app.ppt_generator import generate_report_ppt
import datetime

router = APIRouter(prefix="/api/ppt", tags=["Exports"])

@router.get("/download")
def download_ppt(
    db: Session = Depends(get_db),
    period: str = Query("2026-05-01", description="Report period month (YYYY-MM-DD)"),
    tab: str = Query("brand", description="Selected dashboard tab"),
    timeframe: str = Query("Full year", description="Selected timeframe"),
    view: str = Query("YTD", description="YTD or MoM view"),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        dt = datetime.datetime.strptime(period, "%Y-%m-%d")
        month_filename = dt.strftime("%b_%Y").lower()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Period must be in YYYY-MM-DD format"
        )
        
    try:
        ppt_stream = generate_report_ppt(db, period, tab, timeframe, view)
        filename = f"{tab}_performance_report_{month_filename}.pptx"
        return StreamingResponse(
            ppt_stream,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )