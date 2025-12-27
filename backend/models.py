from pydantic import BaseModel
from typing import List, Optional, Any

class Meta(BaseModel):
    title: str
    description: str
    language: str
    canonical: Optional[str]

class Link(BaseModel):
    text: str
    href: str

class Image(BaseModel):
    src: str
    alt: str

class SectionContent(BaseModel):
    headings: List[str] = []
    text: str = ""
    links: List[Link] = []
    images: List[Image] = []
    lists: List[List[str]] = []
    tables: List[Any] = []

class Section(BaseModel):
    id: str
    type: str
    label: str
    sourceUrl: str
    content: SectionContent
    rawHtml: str
    truncated: bool

class Interactions(BaseModel):
    clicks: List[str] = []
    scrolls: int = 0
    pages: List[str] = []

class ErrorLog(BaseModel):
    message: str
    phase: str

class ScrapeResult(BaseModel):
    url: str
    scrapedAt: str
    meta: Meta
    sections: List[Section]
    interactions: Interactions
    errors: List[ErrorLog] = []

class ScrapeResponse(BaseModel):
    result: ScrapeResult

class ScrapeRequest(BaseModel):
    url: str
