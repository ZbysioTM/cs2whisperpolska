const DISCORD_INVITE_CODE = "Bwfd8VYA";
const DISCORD_INVITE_URL = `https://discord.com/api/v9/invites/${DISCORD_INVITE_CODE}?with_counts=true&with_expiration=true`;
const LOCAL_UPDATES_URL = "./updates.json";

const fallbackUpdates = [
  {
    title: "Aktualizacje CS2 chwilowo niedostępne",
    body: "Jeśli lokalny plik newsów nie został jeszcze wygenerowany przez GitHub Actions, strona pokazuje wpisy zastępcze i link do oficjalnych aktualizacji Counter-Strike 2.",
    date: "Tryb zapasowy",
    url: "https://store.steampowered.com/news/app/730",
    tag: "Fallback",
  },
  {
    title: "Oficjalne newsy Counter-Strike 2",
    body: "Kliknij, aby przejść bezpośrednio do oficjalnych newsów Steam. Po pierwszym uruchomieniu workflow GitHub ta sekcja będzie już automatycznie wypełniana świeżymi wpisami.",
    date: "Steam",
    url: "https://store.steampowered.com/news/app/730",
    tag: "Oficjalne",
  },
  {
    title: "Automatyczne odświeżanie przez GitHub Actions",
    body: "Repozytorium zawiera workflow, który regularnie pobiera newsy CS2 i zapisuje je do pliku updates.json. To działa poprawnie z GitHub Pages, bo przeglądarka czyta już lokalny plik z repozytorium.",
    date: "GitHub",
    url: "https://docs.github.com/actions",
    tag: "Auto",
  },
];

const memberCountElement = document.getElementById("member-count");
const onlineCountElement = document.getElementById("online-count");
const serverStatusElement = document.getElementById("server-status");
const serverNoteElement = document.getElementById("server-note");
const updatesGridElement = document.getElementById("updates-grid");

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

function renderUpdates(items) {
  updatesGridElement.innerHTML = items
    .map((item) => {
      const title = item.title || "Aktualizacja Counter-Strike 2";
      const body = item.body || stripHtml(item.contents || "").slice(0, 220) || "Brak opisu";
      const safeBody = body.length >= 220 ? `${body}...` : body;
      const date = item.date || "Brak daty";
      const link = item.url || "https://store.steampowered.com/news/app/730";
      const tag = item.tag || "CS2 Update";

      return `
        <article class="update-card reveal visible">
          <span class="update-tag">${tag}</span>
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

async function loadCs2Updates() {
  try {
    const response = await fetch(LOCAL_UPDATES_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Local updates response ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    if (!items.length) {
      renderUpdates(fallbackUpdates);
      return;
    }

    renderUpdates(items);
  } catch (error) {
    console.error("Local updates error:", error);
    renderUpdates(fallbackUpdates);
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
loadCs2Updates();
