from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import os
import sys

# Ensure backend directory is in path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from manseoryeok_engine import compute_manseoryeok_data, generate_sewoon, generate_woluun, get_calendar_data

app = FastAPI(title="DALKOM Manseoryeok Mobile Web API")

# Enable CORS for external connections (mobile devices on same Wi-Fi)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ManseoryeokRequest(BaseModel):
    name: str
    gender: str
    calendar_type: str
    year: int
    month: int
    day: int
    hour: int
    minute: int
    unknown_time: bool

@app.post("/api/calculate")
def calculate_manseoryeok(req: ManseoryeokRequest):
    try:
        data = compute_manseoryeok_data(req.dict())
        return {"success": True, "data": data}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sewoon")
def get_sewoon_range(age: int, birth_year: int, daewoon_num: int):
    try:
        sewoons = generate_sewoon(age, birth_year, daewoon_num)
        return {"success": True, "sewoons": sewoons}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/woluun")
def get_woluun_range(year: int):
    try:
        woluun = generate_woluun(year)
        return {"success": True, "woluun": woluun}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/calendar")
def get_calendar(year: int, month: int):
    try:
        data = get_calendar_data(year, month)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Serving static files for mobile web frontend
frontend_path = os.path.join(os.path.dirname(__file__), "../frontend")
if os.path.isdir(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    print(f"Warning: Frontend directory not found at {frontend_path}")

if __name__ == "__main__":
    import uvicorn
    # Bind to 0.0.0.0 so other devices on the same Wi-Fi can connect
    uvicorn.run(app, host="0.0.0.0", port=8001)
