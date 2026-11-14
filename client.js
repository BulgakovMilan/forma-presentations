"use strict";
const $=id=>document.getElementById(id);
const form=$("order-form"),reduce=matchMedia("(prefers-reduced-motion: reduce)");
const labels={
 output:{visual:"Визуальная",editable:"Редактируемая",both:"Оба формата"},
 urgency:{flexible:"Не срочно",week:"В течение недели",soon:"В ближайшие дни",urgent:"Срочно — обсудить"},
 kind:{study:"Учебная",research:"Научная",business:"Деловая",pitch:"Выступление",other:"Другая"},
 style:{custom:"Под задачу",minimal:"Минимализм",editorial:"Редакционный",medical:"Научный",corporate:"Деловой",bold:"Яркий"},
 materials:{partial:"Часть материалов",ready:"Все материалы готовы",from_scratch:"Только тема"},
 delivery:{pptx:"Только PowerPoint",pptx_pdf:"PowerPoint + PDF"}
};
const val=name=>form.elements.namedItem(name)?.value??"";
const mode=()=>reduce.matches?"instant":"smooth";
const scroll=id=>$(id)?.scrollIntoView({behavior:mode(),block:"start"});
const toggle=$("nav-toggle"),menu=$("mobile-nav");
function closeMenu(){menu.hidden=true;toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-label","Открыть меню")}
toggle.addEventListener("click",()=>{
 const open=toggle.getAttribute("aria-expanded")!=="true";
 menu.hidden=!open;toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Закрыть меню":"Открыть меню");
});
document.addEventListener("pointerdown",e=>{if(!menu.hidden&&!menu.contains(e.target)&&!toggle.contains(e.target))closeMenu()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!menu.hidden){closeMenu();toggle.focus()}});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener("click",e=>{
 const id=a.getAttribute("href").slice(1);if(!$(id))return;
 e.preventDefault();closeMenu();scroll(id);history.replaceState(null,"","#"+id);
}));
function updateSelection(){
 const selected=val("output");
 document.querySelectorAll("[data-choose-output]").forEach(b=>{
  const yes=b.dataset.chooseOutput===selected;b.classList.toggle("is-selected",yes);b.setAttribute("aria-pressed",String(yes));
 });
}
document.querySelectorAll("[data-choose-output]").forEach(b=>b.addEventListener("click",()=>{
 const input=form.querySelector('input[name="output"][value="'+b.dataset.chooseOutput+'"]');
 if(!input)return;input.checked=true;input.dispatchEvent(new Event("change",{bubbles:true}));scroll("brief");
}));
form.querySelectorAll('input[name="output"]').forEach(input=>input.addEventListener("change",updateSelection));
updateSelection();
// Portfolio filtering, arrows, dots, finger swipe, and full-screen preview.
const viewport=$("portfolio-viewport"),track=$("portfolio-track"),dots=$("portfolio-dots");
const cards=[...track.querySelectorAll(".portfolio-slide")],prev=$("portfolio-prev"),next=$("portfolio-next");
let step=1,maxScroll=0,scrollTick=false;
const visible=()=>cards.filter(c=>!c.hidden);
function index(){return Math.max(0,Math.round(viewport.scrollLeft/step))}
function status(){
 prev.disabled=viewport.scrollLeft<3;next.disabled=viewport.scrollLeft>=maxScroll-3;
 [...dots.children].forEach((b,i)=>{const active=i===index();b.classList.toggle("active",active);b.setAttribute("aria-current",String(active))});
}
function jump(i){viewport.scrollTo({left:Math.min(maxScroll,Math.max(0,i)*step),behavior:mode()})}
function measure(){
 const a=visible(),itemWidth=a[0]?.getBoundingClientRect().width||1,gap=parseFloat(getComputedStyle(track).gap)||10;
 step=itemWidth+gap;maxScroll=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
 const n=a.length?Math.min(a.length,Math.ceil(maxScroll/step)+1):0;
 dots.replaceChildren();
 for(let i=0;i<n;i++){const b=document.createElement("button");b.type="button";b.className="dot";b.setAttribute("aria-label","Страница "+(i+1));b.addEventListener("click",()=>jump(i));dots.append(b)}
 status();
}
prev.addEventListener("click",()=>jump(index()-1));next.addEventListener("click",()=>jump(index()+1));
viewport.addEventListener("scroll",()=>{if(scrollTick)return;scrollTick=true;requestAnimationFrame(()=>{scrollTick=false;status()})},{passive:true});
const filters=[...document.querySelectorAll("[data-filter]")];
function setFilter(name){
 filters.forEach(b=>{const active=b.dataset.filter===name;b.classList.toggle("is-active",active);b.setAttribute("aria-pressed",String(active))});
 cards.forEach(card=>card.hidden=name!=="all"&&!card.dataset.tags.split(" ").includes(name));
 viewport.scrollTo({left:0,behavior:"instant"});requestAnimationFrame(measure);
}
filters.forEach(b=>b.addEventListener("click",()=>setFilter(b.dataset.filter)));
$("portfolio-show-all").addEventListener("click",()=>{setFilter("all");scroll("portfolio")});
window.addEventListener("resize",()=>requestAnimationFrame(measure),{passive:true});
if("ResizeObserver" in window)new ResizeObserver(()=>requestAnimationFrame(measure)).observe(viewport);
requestAnimationFrame(measure);
const dialog=$("portfolio-dialog");
cards.forEach(card=>card.addEventListener("click",()=>{
 const image=card.querySelector("img");$("dialog-image").src=image.getAttribute("src");$("dialog-image").alt=image.alt;
 $("dialog-title").textContent=card.dataset.title;$("dialog-type").textContent=card.dataset.type;
 dialog.showModal();$("dialog-close").focus();
}));
$("dialog-close").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
dialog.addEventListener("close",()=>{$("dialog-image").removeAttribute("src")});
let lastBrief="";
const errorBox=$("form-error");
function clearError(){
 errorBox.hidden=true;errorBox.textContent="";
 form.querySelectorAll('[aria-invalid="true"]').forEach(x=>x.removeAttribute("aria-invalid"));
}
function error(message,field){
 errorBox.textContent=message;errorBox.hidden=false;
 if(field){field.setAttribute("aria-invalid","true");const details=field.closest("details");if(details)details.open=true;field.focus({preventScroll:false})}
 else{errorBox.setAttribute("tabindex","-1");errorBox.focus()}
}
form.addEventListener("input",e=>{
 if(e.target.getAttribute("aria-invalid")==="true"){e.target.removeAttribute("aria-invalid");errorBox.hidden=true}
});
form.addEventListener("change",()=>{errorBox.hidden=true});
const EMAIL=/^[^@\s]+@[^@\s]+\.[^@\s]+$/,TELEGRAM=/^@[A-Za-z0-9_]{5,32}$/,TG_URL=/^https?:\/\/t\.me\/[A-Za-z0-9_]{5,32}\/?$/;
function valid(){
 clearError();
 for(const input of form.querySelectorAll('input[required],select[required],textarea[required]')){
  if(!input.checkValidity()){
   const label=input.closest(".field")?.querySelector("label")?.textContent?.replace("*","").trim();
   error(input===$("consent")?"Подтвердите согласие перед отправкой.":"Заполните обязательное поле: "+(label||"параметр"),input);return false;
  }
 }
 const contact=val("contact").trim();
 if(!EMAIL.test(contact)&&!TELEGRAM.test(contact)&&!TG_URL.test(contact)){error("Укажите Telegram (@username от 5 символов) или email.",$("contact"));return false}
 const date=val("deadline");
 if(date&&new Date(date+"T12:00:00")<new Date(new Date().toDateString())){error("Выберите будущую или сегодняшнюю дату.",$("deadline"));return false}
 return true;
}
{
 const d=new Date();$("deadline").min=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
}
function getData(){
 const d=Object.fromEntries(new FormData(form).entries());d.slides=Number(val("slides"));d.consent=$("consent").checked;d.speaker_notes=$("speaker_notes").checked;d.urgency=val("urgency");return d;
}
function makeBrief(d){
 return ["Здравствуйте! Хочу обсудить презентацию.","",
 "Тема: "+d.topic,"Формат: "+labels.output[d.output],"Количество: "+d.slides+" слайдов",
 "Срок: "+labels.urgency[d.urgency]+(d.deadline?", дата "+d.deadline:""),
 "Тип: "+labels.kind[d.kind],"Стиль: "+labels.style[d.style],"Материалы: "+labels.materials[d.materials],
 "Размер: "+d.ratio,"Доп. файлы: "+labels.delivery[d.delivery],
 "Заметки для выступления: "+(d.speaker_notes?"Да":"Нет"),
 "Пожелания: "+(d.notes||"не указаны"),"Референсы: "+(d.references||"не указаны"),
 "Аудитория: "+(d.audience||"не указана"),"Цель: "+(d.purpose||"не указана"),
 "Бюджет: "+(d.budget||"обсудим"),"Контакт: "+d.name+" / "+d.contact].join("\n");
}
function success(title,text){
 $("success-heading").textContent=title;$("success-message").textContent=text;
 $("success").hidden=false;$("send").hidden=true;$("success").scrollIntoView({behavior:mode(),block:"nearest"});
}
$("again").addEventListener("click",()=>{
 $("success").hidden=true;$("send").hidden=false;clearError();$("topic").focus({preventScroll:true});$("topic").scrollIntoView({behavior:mode(),block:"center"});
});
$("copy-brief").addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText(lastBrief);$("copy-feedback").textContent="Текст скопирован. Вставьте его в Telegram и отправьте."}
 catch{
  const area=document.createElement("textarea");area.rows=7;area.readOnly=true;area.value=lastBrief;
  $("copy-feedback").replaceChildren(area);area.select();$("copy-feedback").append(document.createTextNode(" Выделите и скопируйте текст вручную."));
 }
});

const RECIPIENT="mm_bulgakov";
$("intake-note").textContent="Бриф будет открыт в Telegram. Отправку необходимо подтвердить самостоятельно.";
$("send").innerHTML='Продолжить в Telegram <span aria-hidden="true">→</span>';
form.addEventListener("submit",e=>{
 e.preventDefault();if(!valid())return;
 const data=getData();lastBrief=makeBrief(data);
 const link=$("telegram-send"),warning=$("copy-feedback");warning.textContent="";
 if(lastBrief.length>1600){link.href="https://t.me/"+RECIPIENT;warning.textContent="Бриф слишком длинный для ссылки. Скопируйте полный текст и отправьте его в чат."}
 else link.href="https://t.me/"+RECIPIENT+"?text="+encodeURIComponent(lastBrief);
 link.hidden=false;$("copy-brief").hidden=false;
 success("Бриф подготовлен","Откройте Telegram, проверьте сообщение и нажмите «Отправить». До этого момента исполнитель ничего не получает.");
});
