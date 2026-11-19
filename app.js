const STORAGE_KEY = "deadline-glow-settings-v1";

const themes = {
  aurora: {
    colors: ["#071e28", "#174e56", "#3d3874", "#15142a"],
    text: "#f8fffd",
    accent: "#7cf5e7",
  },
  sunset: {
    colors: ["#512f57", "#9d4058", "#e36c55", "#351c40"],
    text: "#fffaf1",
    accent: "#ffd166",
  },
  midnight: {
    colors: ["#06111f", "#102b4f", "#101a34", "#040812"],
    text: "#f1f7ff",
    accent: "#63b3ff",
  },
};

const form = document.querySelector("#countdown-form");
const eventInput = document.querySelector("#event-name");
const deadlineInput = document.querySelector("#deadline");
const noteInput = document.querySelector("#focus-note");
const milestoneInputs = [
  document.querySelector("#milestone-one"),
  document.querySelector("#milestone-two"),
  document.querySelector("#milestone-three"),
];
const themeInputs = [...document.querySelectorAll('input[name="theme"]')];
const lockScreen = document.querySelector("#lock-screen");
const previewEvent = document.querySelector("#preview-event");
const previewNote = document.querySelector("#preview-note");
const previewDeadline = document.querySelector("#preview-deadline");
const previewMilestones = [
  document.querySelector("#preview-milestone-one"),
  document.querySelector("#preview-milestone-two"),
  document.querySelector("#preview-milestone-three"),
];
const phoneClock = document.querySelector("#phone-clock");
const phoneTime = document.querySelector("#phone-time");
const phoneDate = document.querySelector("#phone-date");
const countLabel = document.querySelector("#count-label");
const daysValue = document.querySelector("#days-value");
const hoursValue = document.querySelector("#hours-value");
const minutesValue = document.querySelector("#minutes-value");
const secondsValue = document.querySelector("#seconds-value");
const progressFill = document.querySelector("#progress-fill");
const downloadButton = document.querySelector("#download-button");
const resetButton = document.querySelector("#reset-button");
const canvas = document.querySelector("#wallpaper-canvas");
const toast = document.querySelector("#toast");

let createdAt = Date.now();
let toastTimer;

function toLocalInputValue(date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function defaultSettings() {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);
  deadline.setHours(17, 0, 0, 0);

  return {
    event: "Portfolio launch",
    deadline: toLocalInputValue(deadline),
    note: "One focused step at a time.",
    milestones: ["Define the plan", "Finish the first draft", "Review and submit"],
    theme: "aurora",
    createdAt: Date.now(),
  };
}

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.deadline && saved?.event) return { ...defaultSettings(), ...saved };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return defaultSettings();
}

function applySettings(settings) {
  eventInput.value = settings.event;
  deadlineInput.value = settings.deadline;
  noteInput.value = settings.note;
  milestoneInputs.forEach((input, index) => {
    input.value = settings.milestones?.[index] || "";
  });
  const selectedTheme = document.querySelector(`input[name="theme"][value="${settings.theme}"]`);
  (selectedTheme || themeInputs[0]).checked = true;
  createdAt = Number(settings.createdAt) || Date.now();
  syncPreview(false);
}

function currentTheme() {
  return themeInputs.find((input) => input.checked)?.value || "aurora";
}

function currentSettings() {
  return {
    event: eventInput.value.trim() || "Your next milestone",
    deadline: deadlineInput.value,
    note: noteInput.value.trim() || "Keep moving forward.",
    milestones: milestoneInputs.map((input, index) => input.value.trim() || ["Define the plan", "Build the core", "Review and finish"][index]),
    theme: currentTheme(),
    createdAt,
  };
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings()));
}

function formatDeadline(date) {
  if (Number.isNaN(date.getTime())) return "Choose a deadline";
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function updateClock(now = new Date()) {
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now);
  phoneClock.textContent = time;
  phoneTime.textContent = time;
  phoneDate.textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(now);
}

function splitCountdown(target, now = new Date()) {
  const difference = Math.max(0, target.getTime() - now.getTime());
  return {
    complete: difference <= 0,
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference % 86_400_000) / 3_600_000),
    minutes: Math.floor((difference % 3_600_000) / 60_000),
    seconds: Math.floor((difference % 60_000) / 1_000),
  };
}

function updateCountdown() {
  const now = new Date();
  const target = new Date(deadlineInput.value);
  const countdown = splitCountdown(target, now);
  const validTarget = !Number.isNaN(target.getTime());

  daysValue.textContent = validTarget ? countdown.days : "—";
  hoursValue.textContent = validTarget ? String(countdown.hours).padStart(2, "0") : "—";
  minutesValue.textContent = validTarget ? String(countdown.minutes).padStart(2, "0") : "—";
  secondsValue.textContent = validTarget ? String(countdown.seconds).padStart(2, "0") : "—";
  countLabel.textContent = validTarget && countdown.complete ? "Deadline reached" : "Time remaining";

  if (validTarget) {
    const total = Math.max(1, target.getTime() - createdAt);
    const elapsed = Math.max(0, now.getTime() - createdAt);
    progressFill.style.width = `${Math.min(100, (elapsed / total) * 100)}%`;
  } else {
    progressFill.style.width = "0%";
  }

  updateClock(now);
}

function syncPreview(shouldSave = true) {
  const settings = currentSettings();
  previewEvent.textContent = settings.event;
  previewNote.textContent = settings.note;
  previewDeadline.textContent = formatDeadline(new Date(settings.deadline));
  previewMilestones.forEach((element, index) => {
    element.textContent = settings.milestones[index];
  });
  lockScreen.className = `lock-screen theme-${settings.theme}`;
  updateCountdown();
  if (shouldSave) saveSettings();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function setQuickDeadline(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(17, 0, 0, 0);
  deadlineInput.value = toLocalInputValue(date);
  createdAt = Date.now();
  syncPreview();
}

function resetDesigner() {
  localStorage.removeItem(STORAGE_KEY);
  applySettings(defaultSettings());
  showToast("Designer reset to a fresh 30-day countdown.");
}

function wrapLines(context, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function drawTextBlock(context, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const lines = wrapLines(context, text, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function renderWallpaper() {
  const settings = currentSettings();
  const target = new Date(settings.deadline);
  const countdown = splitCountdown(target);
  const palette = themes[settings.theme];
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  context.clearRect(0, 0, width, height);
  const gradient = context.createLinearGradient(0, 0, width, height);
  palette.colors.forEach((color, index) => gradient.addColorStop(index / (palette.colors.length - 1), color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.13;
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(1110, 260, 430, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 0.12;
  context.fillStyle = "#000000";
  context.beginPath();
  context.arc(80, 2260, 500, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  // Quiet upper area is intentionally left open for the phone's system clock and widgets.
  context.fillStyle = palette.accent;
  context.font = "800 34px system-ui, sans-serif";
  context.textAlign = "left";
  context.letterSpacing = "2px";
  context.fillText("DEADLINE GLOW", 108, 720);

  context.fillStyle = palette.text;
  context.font = "800 102px system-ui, sans-serif";
  let cursorY = drawTextBlock(context, settings.event, 108, 850, 1070, 112, 3) + 34;

  context.globalAlpha = 0.76;
  context.font = "500 40px system-ui, sans-serif";
  cursorY = drawTextBlock(context, settings.note, 108, cursorY, 1050, 54, 2) + 54;
  context.globalAlpha = 1;

  roundedRect(context, 88, cursorY, 1114, 360, 56);
  context.fillStyle = "rgba(5, 8, 16, 0.25)";
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.25)";
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = palette.text;
  context.font = "800 28px system-ui, sans-serif";
  context.globalAlpha = 0.72;
  context.fillText(countdown.complete ? "DEADLINE REACHED" : "TIME REMAINING", 136, cursorY + 72);
  context.globalAlpha = 1;

  const units = [
    [countdown.days, "DAYS"],
    [String(countdown.hours).padStart(2, "0"), "HOURS"],
    [String(countdown.minutes).padStart(2, "0"), "MINUTES"],
    [String(countdown.seconds).padStart(2, "0"), "SECONDS"],
  ];
  const unitWidth = 245;
  units.forEach(([value, label], index) => {
    const x = 136 + index * unitWidth;
    context.textAlign = "center";
    context.font = "800 72px system-ui, sans-serif";
    context.fillText(String(value), x + 90, cursorY + 190);
    context.globalAlpha = 0.66;
    context.font = "800 22px system-ui, sans-serif";
    context.fillText(label, x + 90, cursorY + 240);
    context.globalAlpha = 1;
  });

  cursorY += 430;
  context.textAlign = "left";
  context.font = "800 28px system-ui, sans-serif";
  context.fillStyle = palette.accent;
  context.fillText("MILESTONE PLAN", 108, cursorY);
  cursorY += 50;

  const milestoneLabels = ["NOW", "NEXT", "FINAL"];
  settings.milestones.forEach((milestone, index) => {
    roundedRect(context, 88, cursorY, 1114, 150, 34);
    context.fillStyle = "rgba(5, 8, 16, 0.18)";
    context.fill();
    context.strokeStyle = "rgba(255, 255, 255, 0.18)";
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = palette.accent;
    context.font = "800 24px system-ui, sans-serif";
    context.fillText(milestoneLabels[index], 132, cursorY + 88);
    context.fillStyle = palette.text;
    context.font = "700 40px system-ui, sans-serif";
    context.fillText(milestone, 300, cursorY + 92, 820);
    cursorY += 174;
  });

  context.fillStyle = palette.text;
  context.globalAlpha = 0.7;
  context.font = "700 30px system-ui, sans-serif";
  context.fillText(formatDeadline(target), 108, 2630, 1070);
  context.globalAlpha = 1;

  return settings;
}

async function downloadWallpaper() {
  if (!form.reportValidity()) return;
  const target = new Date(deadlineInput.value);
  if (Number.isNaN(target.getTime()) || target.getTime() <= Date.now()) {
    deadlineInput.focus();
    showToast("Choose a deadline in the future before downloading.");
    return;
  }

  downloadButton.disabled = true;
  downloadButton.textContent = "Preparing wallpaper…";

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    const settings = renderWallpaper();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
    if (!blob) throw new Error("The wallpaper could not be created.");

    const safeName = settings.event
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "countdown";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `deadline-glow-${safeName}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Lock screen downloaded at 1290 × 2796 pixels.");
  } catch (error) {
    showToast(error.message || "The wallpaper could not be downloaded.");
  } finally {
    downloadButton.disabled = false;
    downloadButton.textContent = "Download lock screen";
  }
}

form.addEventListener("input", () => syncPreview());
form.addEventListener("change", () => syncPreview());
form.addEventListener("submit", (event) => event.preventDefault());
downloadButton.addEventListener("click", downloadWallpaper);
resetButton.addEventListener("click", resetDesigner);
document.querySelectorAll("[data-days]").forEach((button) => {
  button.addEventListener("click", () => setQuickDeadline(Number(button.dataset.days)));
});
document.querySelector("#year-end").addEventListener("click", () => {
  const now = new Date();
  const yearEnd = new Date(now.getFullYear(), 11, 31, 17, 0, 0, 0);
  if (yearEnd <= now) yearEnd.setFullYear(yearEnd.getFullYear() + 1);
  deadlineInput.value = toLocalInputValue(yearEnd);
  createdAt = Date.now();
  syncPreview();
});

applySettings(readSettings());
window.setInterval(updateCountdown, 1000);
