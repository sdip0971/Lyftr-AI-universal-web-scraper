import asyncio
import datetime
from urllib.parse import urljoin
import httpx
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from backend.models import (
    ScrapeResult, Meta, Section, SectionContent, 
    Interactions, Link, Image, ErrorLog
)

class UniversalScraper:
    def __init__(self):
        self.errors = []
    
    def _get_meta(self, soup, url):
        title = soup.title.string if soup.title else ""
        desc_tag = soup.find("meta", attrs={"name": "description"})
        desc = desc_tag["content"] if desc_tag else ""
        lang_tag = soup.find("html")
        lang = lang_tag.get("lang", "en") if lang_tag else "en"
        canonical_tag = soup.find("link", attrs={"rel": "canonical"})
        canonical = canonical_tag["href"] if canonical_tag else None
        
        return Meta(title=title, description=desc, language=lang, canonical=canonical)

    def _parse_sections(self, soup, source_url):
        sections = []
        elements = soup.find_all(['section', 'header', 'footer', 'main', 'div'])
        
        count = 0
        for el in elements:
            # Noise filter: skip dialogs, cookie banners, hidden elements
            if el.get('role') in ['dialog', 'alert'] or "cookie" in str(el.get('class', '')):
                continue
            
            # Skip if element is hidden
            if el.get('aria-hidden') == "true" or 'hidden' in el.attrs:
                continue

            text = el.get_text(" ", strip=True)
            if len(text) < 50: continue
            
            # Extract Headings
            headings = [h.get_text(strip=True) for h in el.find_all(['h1', 'h2', 'h3'])]
            
            # Extract Links
            links = [Link(text=a.get_text(strip=True), href=urljoin(source_url, a['href'])) 
                     for a in el.find_all('a', href=True) if a.get_text(strip=True)]
            
            # Extract Images
            images = [Image(src=urljoin(source_url, img['src']), alt=img.get('alt', '')) 
                      for img in el.find_all('img', src=True)]

            # Extract Lists (Arrays of strings)
            lists = []
            for ul in el.find_all(['ul', 'ol']):
                items = [li.get_text(strip=True) for li in ul.find_all('li') if li.get_text(strip=True)]
                if items:
                    lists.append(items)

            # Extract Tables (Simple array of arrays)
            tables = []
            for table in el.find_all('table'):
                rows = []
                for tr in table.find_all('tr'):
                    cells = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
                    if any(cells):
                        rows.append(cells)
                if rows:
                    tables.append(rows)
            
            # Derive Label
            label = headings[0] if headings else " ".join(text.split()[:5]) + "..."
            
            # Determine Type
            sec_type = "section"
            if el.name == "header": sec_type = "nav"
            elif el.name == "footer": sec_type = "footer"
            elif "hero" in str(el.get('class', '')): sec_type = "hero"

            raw_html = str(el)[:500]
            truncated = len(str(el)) > 500

            sections.append(Section(
                id=f"sec-{count}",
                type=sec_type,
                label=label,
                sourceUrl=source_url,
                content=SectionContent(
                    headings=headings,
                    text=text[:1000],
                    links=links[:10],
                    images=images[:5],
                    lists=lists[:5],   # Capture first 5 lists
                    tables=tables[:3]  # Capture first 3 tables
                ),
                rawHtml=raw_html,
                truncated=truncated
            ))
            count += 1
            if count > 15: break
            
        return sections if sections else [self._create_fallback_section(soup, source_url)]

    def _create_fallback_section(self, soup, url):
        return Section(
            id="fallback-0",
            type="unknown",
            label="Main Content",
            sourceUrl=url,
            content=SectionContent(text=soup.body.get_text(" ", strip=True)[:500] if soup.body else ""),
            rawHtml=str(soup.body)[:200] if soup.body else "",
            truncated=True
        )

    async def scrape(self, url: str) -> ScrapeResult:
        scraped_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        interactions = Interactions(pages=[url])
        
        # 1. Attempt Static Scrape
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, 'html.parser')
                
                # Heuristic: Check if body has meaningful content
                if len(soup.get_text()) > 500:
                    meta = self._get_meta(soup, url)
                    sections = self._parse_sections(soup, url)
                    return ScrapeResult(
                        url=url, scrapedAt=scraped_at, meta=meta, 
                        sections=sections, interactions=interactions
                    )
        except Exception as e:
            self.errors.append(ErrorLog(message=str(e), phase="static_fetch"))

        # 2. Fallback to Playwright
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                
                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                except:
                    self.errors.append(ErrorLog(message="Timeout/Error loading page", phase="js_load"))

                scroll_count = 0
                for _ in range(3):
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await page.wait_for_timeout(1000)
                    scroll_count += 1
                    
                    # Click 'Load more' buttons
                    try:
                        btn = await page.query_selector("button:has-text('Load more'), button:has-text('Show more')")
                        if btn:
                            await btn.click()
                            interactions.clicks.append("Load more button")
                            await page.wait_for_timeout(1000)
                    except:
                        pass

                interactions.scrolls = scroll_count
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                meta = self._get_meta(soup, url)
                sections = self._parse_sections(soup, url)
                
                await browser.close()
                
                return ScrapeResult(
                    url=url, scrapedAt=scraped_at, meta=meta, 
                    sections=sections, interactions=interactions, errors=self.errors
                )
                
        except Exception as e:
            self.errors.append(ErrorLog(message=str(e), phase="playwright_execution"))
            return ScrapeResult(
                url=url, scrapedAt=scraped_at, 
                meta=Meta(title="Error", description="", language="en", canonical=None),
                sections=[], interactions=interactions, errors=self.errors
            )
