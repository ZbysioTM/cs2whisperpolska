import json
import re
import urllib.request
from datetime import datetime, timezone

STEAM_NEWS_URL = (
    "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/"
    "?appid=730&count=5&maxlength=1200&feeds=steam_community_announcements"
)
OUTPUT_PATH = "updates.json"
FALLBACK_URL = "https://store.steampowered.com/news/app/730"


def strip_html(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    text = re.sub(r"https?://\S+", " ", text)
    text = text.replace("\\", ". ")
    text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)
    text = re.sub(r"([.?!:;])([A-Za-z0-9])", r"\1 \2", text)
    text = re.sub(
        r"\b(Fixed|Added|Improved|Updated|Changed|Removed|Tweaked|Release Notes)\b",
        r". \1",
        text,
    )
    text = re.sub(r"\s*\.\s*\.", ". ", text)
    text = re.sub(r"\s+\.\s+", ". ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" .")


def format_date(unix_seconds: int) -> str:
    dt = datetime.fromtimestamp(unix_seconds, tz=timezone.utc)
    return dt.strftime("%d.%m.%Y")


def load_news() -> dict:
    request = urllib.request.Request(
        STEAM_NEWS_URL,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.loads(response.read().decode("utf-8"))

    items = []
    for item in data.get("appnews", {}).get("newsitems", [])[:5]:
        body = strip_html(item.get("contents", ""))
        body = body[:700].rsplit(" ", 1)[0].strip() if len(body) > 700 else body
        items.append(
            {
                "title": item.get("title") or "Aktualizacja Counter-Strike 2",
                "body": body or "Brak opisu aktualizacji.",
                "date": format_date(item.get("date", 0)) if item.get("date") else "Brak daty",
                "url": FALLBACK_URL,
                "tag": "CS2 Update",
            }
        )

    if not items:
        raise RuntimeError("No news items returned from Steam API")

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "items": items,
    }


def main() -> None:
    payload = load_news()
    with open(OUTPUT_PATH, "w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")


if __name__ == "__main__":
    main()
