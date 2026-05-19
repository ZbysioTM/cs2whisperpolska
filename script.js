const DISCORD_INVITE_URL_VALUE = "https://discord.gg/MGU3qsyBDB";
const DISCORD_INVITE_CODE = DISCORD_INVITE_URL_VALUE.split("/").pop();
const DISCORD_INVITE_URL = `https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true&with_expiration=true`;
const LOCAL_UPDATES_URL = "./updates.json";
const STEAM_UPDATES_URL = "https://store.steampowered.com/news/app/730";
const UPDATES_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

const fallbackUpdates = [
  {
    title: "Aktualizacje CS2 chwilowo niedostepne",
    body: "Jesli lokalny plik newsow nie zostal jeszcze wygenerowany przez GitHub Actions, strona pokazuje wpisy zastepcze i link do oficjalnych aktualizacji Counter-Strike 2.",
    date: "Tryb zapasowy",
    url: "https://store.steampowered.com/news/app/730",
    tag: "Fallback",
  },
  {
    title: "Oficjalne newsy Counter-Strike 2",
    body: "Kliknij, aby przejsc bezposrednio do oficjalnych newsow Steam. Po pierwszym uruchomieniu workflow GitHub ta sekcja bedzie juz automatycznie wypelniana swiezymi wpisami.",
    date: "Steam",
    url: "https://store.steampowered.com/news/app/730",
    tag: "Oficjalne",
  },
  {
    title: "Automatyczne odswiezanie przez GitHub Actions",
    body: "Repozytorium zawiera workflow, ktory regularnie pobiera newsy CS2 i zapisuje je do pliku updates.json. To dziala poprawnie z GitHub Pages, bo przegladarka czyta lokalny plik z repozytorium.",
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
const updatesFeedStatusElement = document.getElementById("updates-feed-status");

function stripHtml(value) {
  const temp = document.createElement("div");
  temp.innerHTML = value;
  const text = (temp.textContent || temp.innerText || "").replace(/\\n/g, " ");
  return text.replace(/\s+/g, " ").trim();
}

function normalizeUpdateText(value) {
  const cleaned = stripHtml(value)
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\\/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([.?!:;])([A-Za-z0-9])/g, "$1 $2")
    .replace(/\.(?=[A-Za-z0-9])/g, ". ")
    .replace(/,(?=[A-Za-z0-9])/g, ", ")
    .replace(/(Fixed|Added|Improved|Updated|Changed|Removed|Tweaked|Release Notes)/g, ". $1")
    .replace(/\s*\.\s*\./g, ". ")
    .replace(/\s+\.\s+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Brak opisu";
  }

  const sentences = cleaned.match(/[^.!?]+[.!?]?/g) || [cleaned];
  const shortText = sentences.slice(0, 5).join(" ").trim();
  const result = shortText || cleaned;

  return result.length > 520 ? `${result.slice(0, 517).trim()}...` : result;
}

function formatGeneratedDate(value) {
  if (!value) {
    return "Brak danych";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Brak danych";
  }

  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderUpdatesOverview(items, generatedAt) {
  if (!updatesFeedStatusElement) {
    return;
  }

  const totalItems = items.length;
  const latestItem = items[0];
  const latestTitle = latestItem?.title || "Brak aktualizacji";
  const latestDate = latestItem?.date || "Brak daty";
  const refreshedAt = formatGeneratedDate(generatedAt);

  updatesFeedStatusElement.innerHTML = `
    <span class="update-tag">Status feedu</span>
    <h3>${totalItems} ostatnie ${totalItems === 1 ? "wydanie" : "wpisy"} w sekcji</h3>
    <p>
      Ostatnie odswiezenie: <strong>${refreshedAt}</strong>.<br />
      Najnowszy wpis: <strong>${latestTitle}</strong> z dnia <strong>${latestDate}</strong>.
    </p>
  `;
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

    memberCountElement.textContent = Number.isFinite(members) ? members.toLocaleString("pl-PL") : "--";
    onlineCountElement.textContent = Number.isFinite(online) ? online.toLocaleString("pl-PL") : "--";
    serverStatusElement.textContent = guildName;
    serverNoteElement.textContent =
      "Statystyki sa pobierane automatycznie z aktywnego zaproszenia Discord i odswiezaja sie przy kazdym wejsciu na strone.";
  } catch (error) {
    memberCountElement.textContent = "--";
    onlineCountElement.textContent = "--";
    serverStatusElement.textContent = "Nie udalo sie pobrac";
    serverNoteElement.textContent =
      "Jesli Discord blokuje odczyt statystyk, link zaproszenia nadal dziala poprawnie. W razie potrzeby mozna wlaczyc widget serwera, aby zwiekszyc niezawodnosc danych publicznych.";
    console.error("Discord stats error:", error);
  }
}

function renderUpdates(items) {
  updatesGridElement.innerHTML = items
    .map((item, index) => {
      const title = item.title || "Aktualizacja Counter-Strike 2";
      const body = normalizeUpdateText(item.body || item.contents || "");
      const date = item.date || "Brak daty";
      const link = STEAM_UPDATES_URL;
      const tag = item.tag || "CS2 Update";
      const priorityClass = index === 0 ? "update-card priority" : "update-card";

      return `
        <article class="${priorityClass} reveal visible">
          <span class="update-tag">${tag}</span>
          <h3>${title}</h3>
          <p>${body}</p>
          <div class="update-meta">
            <span>${date}</span>
            <a class="update-link" href="${link}" target="_blank" rel="noreferrer">Czytaj wiecej</a>
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
    const generatedAt = data.generated_at || "";

    if (!items.length) {
      renderUpdatesOverview(fallbackUpdates, generatedAt);
      renderUpdates(fallbackUpdates);
      return;
    }

    renderUpdatesOverview(items, generatedAt);
    renderUpdates(items);
  } catch (error) {
    console.error("Local updates error:", error);
    renderUpdatesOverview(fallbackUpdates, "");
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
setInterval(loadCs2Updates, UPDATES_REFRESH_INTERVAL_MS);
