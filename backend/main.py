from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.models import ScrapeRequest, ScrapeResponse
from backend.scraper import UniversalScraper
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
async def health_check():
    return {"status": "ok"}

@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_url(request: ScrapeRequest):
    if not request.url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL scheme")
    
    scraper = UniversalScraper()
    result = await scraper.scrape(request.url)
    return {"result": result}

if os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
