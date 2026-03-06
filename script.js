const DISCORD_INVITE_CODE = "Bwfd8VYA";
const DISCORD_INVITE_URL = `https://discord.com/api/v9/invites/${DISCORD_INVITE_CODE}?with_counts=true&with_expiration=true`;
const STEAM_NEWS_URL =
  "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=730&count=3&maxlength=280&feeds=steam_community_announcements";

const memberCountElement = document.getElementById("member-count");
const onlineCountElement = document.getElementById("online-count");
const serverStatusElement = document.getElementById("server-status");
const serverNoteElement = document.getElementById("server-note");
const updatesGridElement = document.getElementById("updates-grid");

function formatSteamDate(unixSeconds) {
  if (!unixSeconds) {
    return "Brak daty";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(unixSeconds * 1000));
}

function stripHtml(value) {
  const temp = document.createElement("div");
  temp.innerHTML = value;
  return (temp.textContent || temp.innerText || "").trim();
}

async function loadDiscordStats() {
  try {
    const response = await fetch(DISCORD_INVITE_URL);
    if (!response.ok) {
      throw new Error(`Discord response ${response.status}`);
    }

    const data = await response.json();
    const guildName = data.guild?.name || "CS2 WHISPER POLSKA";
    const members = data.approximate_member_count;
    const online = data.approximate_presence_count;

    memberCountElement.textContent = members ? members.toLocaleString("pl-PL") : "--";
    onlineCountElement.textContent = online ? online.toLocaleString("pl-PL") : "--";
    serverStatusElement.textContent = guildName;
    serverNoteElement.textContent =
      "Statystyki są pobierane automatycznie z aktywnego zaproszenia Discord i odświeżają się przy każdym wejściu na stronę.";
  } catch (error) {
    memberCountElement.textContent = "--";
    onlineCountElement.textContent = "--";
    serverStatusElement.textContent = "Nie udało się pobrać";
    serverNoteElement.textContent =
      "Jeśli Discord blokuje odczyt statystyk, link zaproszenia nadal działa poprawnie. W razie potrzeby można włączyć widget serwera, aby zwiększyć niezawodność danych publicznych.";
    console.error("Discord stats error:", error);
  }
}

function renderSteamUpdates(items) {
  if (!items.length) {
    updatesGridElement.innerHTML = `
      <article class="update-card">
        <span class="update-tag">Brak danych</span>
        <h3>Nie udało się pobrać aktualizacji CS2.</h3>
        <p>Spróbuj ponownie później albo odśwież stronę.</p>
      </article>
    `;
    return;
  }

  updatesGridElement.innerHTML = items
    .map((item) => {
      const title = item.title || "Aktualizacja Counter-Strike 2";
      const body = stripHtml(item.contents || "").slice(0, 220) || "Brak opisu";
      const safeBody = body.length >= 220 ? `${body}...` : body;
      const date = formatSteamDate(item.date);
      const link = item.url || "https://store.steampowered.com/app/730/CounterStrike_2/";

      return `
        <article class="update-card reveal visible">
          <span class="update-tag">CS2 Update</span>
          <h3>${title}</h3>
          <p>${safeBody}</p>
          <div class="update-meta">
            <span>${date}</span>
            <a class="update-link" href="${link}" target="_blank" rel="noreferrer">Czytaj więcej</a>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadSteamUpdates() {
  try {
    const response = await fetch(STEAM_NEWS_URL);
    if (!response.ok) {
      throw new Error(`Steam response ${response.status}`);
    }

    const data = await response.json();
    const items = data.appnews?.newsitems || [];
    renderSteamUpdates(items);
  } catch (error) {
    console.error("Steam news error:", error);
    renderSteamUpdates([]);
  }
}

function initRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
    }
  );

  elements.forEach((element) => observer.observe(element));
}

initRevealAnimations();
loadDiscordStats();
loadSteamUpdates();
