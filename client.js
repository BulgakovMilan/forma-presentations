"use strict";
const form = document.querySelector("#order-form");
const stages = [...document.querySelectorAll(".form-stage")];
const errorBox = document.querySelector("#form-error");
const $ = id => document.getElementById(id);
const label = {
  output: { visual:"Визуальная", editable:"Редактируемая", both:"Оба варианта" },
  style: { minimal:"Минимализм", editorial:"Редакционный", medical:"Научный", corporate:"Деловой", bold:"Яркий", custom:"По референсу" },
  kind: { study:"Учёба / образование", business:"Бизнес / отчёт", pitch:"Выступление", research:"Научная работа", other:"Другая задача" },
  materials: { ready:"Все материалы готовы", partial:"Часть материалов", from_scratch:"Только тема" },
  ratio: { "16:9":"16:9", "4:3":"4:3", portrait:"Вертикальная" },
  delivery: { pptx:"Только PPTX", pptx_pdf:"PPTX + PDF" }
};
const explanations = {
  visual: ["Максимум визуальной свободы", "Слайды могут получиться особенно эффектными благодаря сложным композициям. При этом текст и графика внутри изображения не редактируются отдельно — для изменений обычно нужна пересборка слайда."],
  editable: ["Удобно обновлять самостоятельно", "Основной текст, фигуры и диаграммы остаются объектами PowerPoint. Дизайн тоже может быть профессиональным; сложные иллюстрации и отдельные эффекты иногда остаются картинками."],
  both: ["Два результата — отдельное согласование", "Можно обсудить визуальную версию для показа и редактируемую для обновлений. Одинаковый дизайн в двух форматах не гарантирован, дополнительные трудозатраты и стоимость согласуем заранее."]
};
let step = 0;
function value(name) { return form.elements[name]?.value ?? ""; }
function hideError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
  form.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute("aria-invalid"));
}
function showError(message) {
  errorBox.textContent = message; errorBox.hidden = false;
  errorBox.setAttribute("tabindex", "-1");
  errorBox.focus({preventScroll:false});
}
function currentSummary(){
  $("sum-output").textContent = label.output[value("output")] || "—";
  $("sum-style").textContent = label.style[value("style")] || "—";
  $("sum-slides").textContent = value("slides") || "—";
  $("sum-deadline").textContent = value("deadline") ? new Date(value("deadline")+"T12:00:00").toLocaleDateString("ru-RU") : "Уточняется";
  const selected = explanations[value("output")] || explanations.editable;
  const insight = $("format-insight");
  insight.replaceChildren();
  const title = document.createElement("strong"); title.textContent = selected[0];
  const text = document.createElement("span"); text.textContent = selected[1];
  insight.append(title,text);
}
function displayStage(next, focus = true){
  step = next;
  for(let i = 0; i < stages.length; i++) stages[i].hidden = (i !== step);
  $("stage-number").textContent = String(step + 1).padStart(2, "0");
  $("stage-progress").style.width = ((step + 1) / stages.length * 100) + "%";
  $("back").hidden = step === 0;
  $("next").hidden = step === stages.length - 1;
  $("send").hidden = step !== stages.length - 1;
  hideError();
  if(step === 2) buildReview();
  const section = $("brief");
  section.scrollIntoView({behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block:"start"});
  if(focus) {
    const first = stages[step].querySelector("input:not([type=radio]):not([type=checkbox]), select, textarea");
    if(first) first.focus({preventScroll:true});
  }
}
function validateStage(){
  for(const input of stages[step].querySelectorAll("input, textarea, select")){
    if(!input.checkValidity()){
      input.setAttribute("aria-invalid", "true");
      input.focus({preventScroll:false});
      input.reportValidity();
      if(input.type === "checkbox") showError("Для отправки заявки требуется согласие на использование контактных данных.");
      return false;
    }
  }
  if(step === 2) {
    const contact = value("contact").trim();
    const isTelegram = /^@[a-zA-Z0-9_]{5,32}$/.test(contact) || /^https?:\/\/t\.me\/[a-zA-Z0-9_]{5,32}\/?$/.test(contact);
    const isMail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact);
    if(!isTelegram && !isMail){
      showError("Укажите действующий Telegram (@username, от 5 символов) или email, чтобы можно было связаться с вами.");
      $("contact").setAttribute("aria-invalid", "true");
      $("contact").focus({preventScroll:false});
      return false;
    }
  }
  return true;
}
function buildReview(){
  const list = [
    ["Задача", label.kind[value("kind")] || "—"],
    ["Формат", label.output[value("output")] || "—"],
    ["Стиль", label.style[value("style")] || "—"],
    ["Слайдов", value("slides")],
    ["Размер", label.ratio[value("ratio")] || "16:9"],
    ["Желаемая дата", value("deadline") || "—"],
    ["Тема", value("topic") || "—"],
    ["Материалы", label.materials[value("materials")] || "—"],
    ["Файлы", label.delivery[value("delivery")] || "PPTX"],
    ["Заметки", $("speaker_notes").checked ? "Нужны, обсудить" : "Не требуются"],
  ];
  const dl = $("review"); dl.replaceChildren();
  for(const [a,b] of list){
    const dt = document.createElement("dt"); dt.textContent = a;
    const dd = document.createElement("dd"); dd.textContent = b;
    dl.append(dt,dd);
  }
}
function defaultDate(){
  const now = new Date();
  const y = now.getFullYear(), m = String(now.getMonth()+1).padStart(2,"0"), d=String(now.getDate()).padStart(2,"0");
  return [y,m,d].join("-");
}
$("deadline").min = defaultDate();
$("deadline").value = defaultDate();
form.addEventListener("input",currentSummary);
form.addEventListener("change",currentSummary);
for(const btn of document.querySelectorAll("[data-choose-output]")){
  btn.addEventListener("click",()=>{
    const output = btn.dataset.chooseOutput;
    const field = form.querySelector('input[name="output"][value="' + output + '"]');
    if(!field) return;
    field.checked = true;
    field.dispatchEvent(new Event("change",{bubbles:true}));
    displayStage(0,false);
    field.focus({preventScroll:true});
  });
}
$("back").addEventListener("click",()=>displayStage(Math.max(0,step-1)));
$("next").addEventListener("click",()=>{
  if(validateStage()) displayStage(Math.min(step+1,2));
});

// No order database and no automatic submission on this public static site.
const RECIPIENT = "mm_bulgakov";
let lastBrief = "";
function makeBrief(data) {
  const yes = data.speaker_notes ? "Да" : "Нет";
  const rows = [
    "Здравствуйте! Хочу обсудить презентацию.",
    "",
    "Тема: " + (data.topic || "—"),
    "Тип: " + (label.kind[data.kind] || data.kind),
    "Формат: " + (label.output[data.output] || data.output),
    "Стиль: " + (label.style[data.style] || data.style),
    "Слайдов: " + (data.slides || "—"),
    "Соотношение сторон: " + (data.ratio || "16:9"),
    "Желаемый срок: " + (data.deadline || "уточняется"),
    "Материалы: " + (label.materials[data.materials] || "уточнить"),
    "Нужен PDF: " + (data.delivery === "pptx_pdf" ? "Да" : "Нет"),
    "Заметки для выступления: " + yes,
    "Аудитория: " + (data.audience || "не указана"),
    "Цель: " + (data.purpose || "не указана"),
    "Бюджет: " + (data.budget || "обсудим"),
    "Контакт: " + (data.contact || "—") + " / " + (data.name || "—"),
    "Референсы: " + (data.references || "не указаны"),
    "Пожелания: " + (data.notes || "не указаны")
  ];
  return rows.join("\n");
}
// Long briefs must never be silently truncated. Use manual copy when the
// encoded Telegram URL could exceed practical mobile browser limits.
const TELEGRAM_URL_MAX = 4000;
function chatUrl(message) {
  const url = "https://t.me/" + RECIPIENT + "?text=" + encodeURIComponent(message);
  return url.length <= TELEGRAM_URL_MAX ? url : null;
}
form.addEventListener("submit", event => {
  event.preventDefault();
  if (step !== 2 || !validateStage()) return;
  hideError();
  const data = Object.fromEntries(new FormData(form).entries());
  data.speaker_notes = $("speaker_notes").checked;
  lastBrief = makeBrief(data);
  const url = chatUrl(lastBrief);
  const link = $("telegram-send");
  const feedback = $("copy-feedback");
  feedback.replaceChildren();
  if (url) {
    link.href = url;
    link.textContent = "Открыть Telegram с брифом →";
    feedback.textContent = "Проверьте текст в Telegram и нажмите «Отправить».";
  } else {
    // A long URL is unreliable on mobile. Preserve the complete brief.
    link.href = "https://t.me/" + RECIPIENT;
    link.textContent = "Открыть чат в Telegram →";
    feedback.textContent = "Бриф слишком длинный для ссылки. Сначала нажмите «Скопировать бриф», затем откройте чат и вставьте текст целиком. Ничего не сокращено.";
  }
  stages.forEach(s => s.hidden = true);
  $("form-actions").hidden = true;
  $("success").hidden = false;
  $("success").scrollIntoView({behavior:"smooth",block:"center"});
  // Explicit user click is required. Do not trigger a popup on submission:
  // mobile browsers can block it and users may lose their completed form.
});
$("copy-brief").addEventListener("click", async () => {
  const feedback = $("copy-feedback");
  try {
    await navigator.clipboard.writeText(lastBrief);
    feedback.textContent = "Текст скопирован. Вставьте его в чат с исполнителем и отправьте.";
  } catch {
    const box = document.createElement("textarea");
    box.value = lastBrief; box.style.width = "100%"; box.rows = 7;
    feedback.replaceChildren(box);
    box.focus(); box.select();
    feedback.append(document.createTextNode(" Выделите текст и скопируйте вручную."));
  }
});
const sticky = document.querySelector(".mobile-fixed-cta");
const briefSection = document.querySelector("#brief");
if (sticky && briefSection && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    sticky.classList.toggle("is-hidden", entries[0].isIntersecting);
  }, {threshold:0.06});
  observer.observe(briefSection);
}
$("again").addEventListener("click",()=>{
  form.reset();
  $("deadline").value = defaultDate();
  $("success").hidden = true;
  $("form-actions").hidden = false;
  currentSummary();
  displayStage(0);
});
currentSummary();
