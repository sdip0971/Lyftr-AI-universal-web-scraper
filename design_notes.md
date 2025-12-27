# Design Notes

## Static vs JS Fallback
- Strategy: We attempt a fast httpx request first. If the resulting HTML body text is < 500 characters, we assume the content is JS-rendered and switch to Playwright.

## Wait Strategy for JS
- [x] Network idle
- [ ] Fixed sleep
- [ ] Wait for selectors
- Details: We use wait_until="domcontentloaded" combined with a 1-second sleep loop during scrolling.

## Click & Scroll Strategy
- Click flows implemented: Explicitly look for "Load more" / "Show more" buttons.
- Scroll approach: Execute window.scrollTo(0, document.body.scrollHeight) in a loop (depth 3).
- Stop conditions: Stop after 3 iterations.

## Section Grouping & Labels
- Grouping: Iterate over high-level tags (section, header, footer, main).
- Labels: Use first h1-h3 tag or first 5 words of text.
