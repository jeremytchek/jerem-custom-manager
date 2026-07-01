const $=id=>document.getElementById(id);const STORE="jerem_custom_v1_final_fix_paiement";const OLD_STORE="jerem_custom_v1_final_propre_unique";let db=loadDB(),docId=null,docType="production",payMode="unpaid",prodId=null;
function empty(){return{orders:[],stock:[],expenses:[],suppliers:[],payments:[],settings:{business:"Jerem Custom",desc:"Flocage textile · T-shirt · Casquette · Pull",phone:"",email:""}}}
function clean(d){d=d||empty();["orders","stock","expenses","suppliers","payments"].forEach(k=>d[k]=Array.isArray(d[k])?d[k]:[]);d.settings=d.settings||empty().settings;d.orders.forEach(o=>{o.id=o.id||Date.now()+Math.random();o.items=Array.isArray(o.items)?o.items:[];o.history=Array.isArray(o.history)?o.history:[];o.status=o.status||"À faire";o.priority=o.priority||"Normal";o.payment=o.payment||o.paymentMethod||"Non défini";o.total=o.items.reduce((s,i)=>s+(+i.price||0),0)||(+o.total||0);o.archived=!!o.archived});d.stock.forEach(s=>{s.type=s.type||"Textile";s.qty=+s.qty||0;s.min=+s.min||0});return d}
function loadDB(){try{let s=localStorage.getItem(STORE)||localStorage.getItem(OLD_STORE);if(s)return clean(JSON.parse(s))}catch(e){}return clean(window.JEREM_INITIAL_DATA||{})}
function save(){localStorage.setItem(STORE,JSON.stringify(db));renderAll()}function euro(n){return(Number(n)||0).toFixed(2).replace(".",",")+" €"}function today(){return new Date().toISOString().slice(0,10)}function active(){return db.orders.filter(o=>!o.archived&&o.status!=="Payé"&&!(o.production&&o.production.ready))}
function paidFor(id){return db.payments.filter(p=>String(p.orderId)===String(id)).reduce((s,p)=>s+(+p.amount||0),0)}function rest(o){return Math.max(0,(+o.total||0)-(+o.deposit||0)-paidFor(o.id))}
function autoPaid(o){if(!o)return;if(o.status==="Payé"||rest(o)<=0&&o.total>0){o.status="Payé";o.archived=true;o.production=o.production||{};o.production.ready=true}}
function showTab(id){document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.id===id));document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));$("pageTitle").textContent=document.querySelector(`nav button[data-tab="${id}"]`)?.textContent||"Jerem Custom";renderAll()}document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
function nextNo(){let y=new Date().getFullYear(),m=0;db.orders.forEach(o=>{let r=String(o.number||"").match(/(\d+)$/);if(r)m=Math.max(m,+r[1])});return`JC-${y}-${String(m+1).padStart(4,"0")}`}
function itemTemplate(i={}){return`<div class="item"><div class="row"><b>Article</b><button class="danger" onclick="this.closest('.item').remove();calc()">Supprimer</button></div><div class="form-grid"><label>Article<input class="a" value="${i.article||""}"></label><label>Taille<input class="s" value="${i.size||""}"></label><label>Textile<input class="tc" value="${i.textileColor||""}"></label><label>Logo<input class="l" value="${i.logo||""}"></label><label>Couleur logo<input class="lc" value="${i.logoColor||""}"></label><label>Prénom / texte<input class="f" value="${i.firstname||""}"></label><label>Couleur texte<input class="fc" value="${i.firstnameColor||""}"></label><label>Placement<input class="p" value="${i.placement||"Dos + cœur"}"></label><label>Prix<input class="pr" type="number" step="0.01" value="${i.price||0}"></label></div></div>`}
function addItem(i=null){if(i===null){let prev=[...$("items").children].at(-1);i=prev?{article:prev.querySelector(".a").value,size:"",textileColor:prev.querySelector(".tc").value,logo:prev.querySelector(".l").value,logoColor:prev.querySelector(".lc").value,firstname:"",firstnameColor:prev.querySelector(".fc").value,placement:prev.querySelector(".p").value,price:+prev.querySelector(".pr").value||0}:{logo:$("quickLogo").value,logoColor:$("quickLogoColor").value,placement:$("quickPlacement").value||"Dos + cœur",price:+$("quickPrice").value||0}}$("items").insertAdjacentHTML("beforeend",itemTemplate(i||{}));[...$("items").querySelectorAll("input")].forEach(x=>x.oninput=calc);calc()}
function readItems(){return[...$("items").children].map(el=>({article:el.querySelector(".a").value,size:el.querySelector(".s").value,textileColor:el.querySelector(".tc").value,logo:el.querySelector(".l").value,logoColor:el.querySelector(".lc").value,firstname:el.querySelector(".f").value,firstnameColor:el.querySelector(".fc").value,placement:el.querySelector(".p").value,price:+el.querySelector(".pr").value||0}))}
function calc(){let t=readItems().reduce((s,i)=>s+(i.price||0),0);$("total").textContent=euro(t);$("profit").textContent=euro(t-(+$("cost").value||0))}
function resetEditor(){["editId","number","client","phone","email","delivery","notes","quickLogo","quickLogoColor","quickPlacement"].forEach(id=>$(id).value="");$("created").value=today();$("status").value="À faire";$("payment").value="Non défini";$("priority").value="Normal";$("deposit").value=0;$("cost").value=0;$("quickPrice").value=0;$("photo").value="";$("photoPreview").innerHTML="";$("history").innerHTML="";$("items").innerHTML="";$("editorTitle").textContent="Nouvelle commande";addItem({})}
function editOrder(id){let o=db.orders.find(x=>x.id==id);if(!o)return;$("editId").value=o.id;$("number").value=o.number||"";$("client").value=o.client||"";$("phone").value=o.phone||"";$("email").value=o.email||"";$("created").value=(o.created||today()).slice(0,10);$("delivery").value=o.delivery||"";$("status").value=o.status||"À faire";$("payment").value=o.payment||"Non défini";$("priority").value=o.priority||"Normal";$("deposit").value=o.deposit||0;$("cost").value=o.cost||0;$("notes").value=o.notes||"";$("photoPreview").innerHTML=o.photo?`<img class="preview" src="${o.photo}">`:"";$("items").innerHTML="";(o.items.length?o.items:[{}]).forEach(addItem);$("history").innerHTML=o.history.length?`<div class="history"><b>Historique</b><br>${o.history.slice(-8).map(h=>`${h.date} · ${h.text}`).join("<br>")}</div>`:"";$("editorTitle").textContent="Modifier "+(o.number||"");showTab("editor")}
function photo(cb){let f=$("photo").files[0];if(!f)return cb(null);let r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(f)}
function saveOrder(){let c=$("client").value.trim();if(!c)return alert("Client obligatoire");photo(ph=>{let id=$("editId").value,o=db.orders.find(x=>x.id==id),items=readItems(),total=items.reduce((s,i)=>s+(i.price||0),0);let d={number:$("number").value||nextNo(),client:c,phone:$("phone").value,email:$("email").value,created:$("created").value||today(),delivery:$("delivery").value,status:$("status").value,payment:$("payment").value,priority:$("priority").value,deposit:+$("deposit").value||0,cost:+$("cost").value||0,notes:$("notes").value,items,total,updated:new Date().toISOString()};if(o){Object.assign(o,d);if(ph)o.photo=ph;o.history.push({date:new Date().toLocaleString("fr-FR"),text:"Commande modifiée"})}else{o={id:Date.now(),archived:false,photo:ph||"",history:[{date:new Date().toLocaleString("fr-FR"),text:"Commande créée"}],...d};db.orders.unshift(o)}autoPaid(o);save();editOrder(o.id)})}
function duplicate(){let id=$("editId").value,o=db.orders.find(x=>x.id==id);if(!o)return;let n=JSON.parse(JSON.stringify(o));n.id=Date.now();n.number=nextNo();n.status="À faire";n.archived=false;n.production={};n.created=today();n.history=[{date:new Date().toLocaleString("fr-FR"),text:"Commande reprise / dupliquée"}];db.orders.unshift(n);save();editOrder(n.id)}
function archive(){let o=db.orders.find(x=>x.id==$("editId").value);if(o){o.archived=true;o.production=o.production||{};o.production.ready=true;if(o.status!=="Payé")o.status="Terminé";save();showTab("done")}}function del(){if(confirm("Supprimer ?")){db.orders=db.orders.filter(o=>o.id!=$("editId").value);save();resetEditor()}}function waiting(){let o=db.orders.find(x=>x.id==$("editId").value)||db.orders.find(x=>x.id==prodId);if(!o)return;o.status="En attente client";o.waiting=true;o.planDate="";o.history.push({date:new Date().toLocaleString("fr-FR"),text:"Mise en attente client"});prodId=null;save();showTab("waiting")}
function card(o,cls=""){return`<div class="order ${cls} ${o.priority==="Urgent"?"urgent":""}"><div class="row"><div><b>${o.client}</b><br><small>${o.number||""} · ${o.status||""} · ${o.delivery||"-"}</small></div><div><button onclick="editOrder(${o.id})">Ouvrir</button><button class="ghost" onclick="openDoc(${o.id},'production')">Imprimer</button></div></div><div><span class="badge">${euro(o.total)}</span><span class="badge ${rest(o)>0?'red':'green'}">${rest(o)>0?'Reste '+euro(rest(o)):'Payé'}</span></div><div>${(o.items||[]).map(i=>`<span class="badge">${i.article} ${i.size||""} ${i.firstname||i.logo||""}</span>`).join("")}</div></div>`}
function renderOrders(){let q=$("qOrders").value.toLowerCase(),s=$("fStatus").value,p=$("fPriority").value;let arr=active().filter(o=>o.status!=="En attente client"&&(!s||o.status===s)&&(!p||o.priority===p)&&(!q||JSON.stringify(o).toLowerCase().includes(q)));$("ordersList").innerHTML=arr.map(o=>card(o,rest(o)>0?"unpaid":"")).join("")||"<p>Aucune commande.</p>"}
function renderWaiting(){let q=$("qWaiting").value.toLowerCase();let arr=db.orders.filter(o=>!o.archived&&(o.waiting||o.status==="En attente client")&&(!q||JSON.stringify(o).toLowerCase().includes(q)));$("waitingList").innerHTML=arr.map(o=>`<div class="order waiting"><div class="row"><b>${o.client}</b><span class="badge orange">EN ATTENTE</span></div><div>${(o.items||[]).map(i=>`<span class="badge">${i.article} ${i.size||""}</span>`).join("")}</div><div class="actions"><button onclick="accept(${o.id})">Client accepte</button><button class="ghost" onclick="editOrder(${o.id})">Modifier</button><button class="danger" onclick="refuse(${o.id})">Client refuse</button></div></div>`).join("")||"<p>Aucune attente.</p>"}function accept(id){let o=db.orders.find(x=>x.id==id);o.waiting=false;o.status="À faire";save();editOrder(id)}function refuse(id){if(confirm("Supprimer cette commande ?")){db.orders=db.orders.filter(o=>o.id!=id);save()}}
function prodQueue(){return active().filter(o=>!o.waiting&&o.status!=="En attente client"&&!["Terminé","Livré","Payé"].includes(o.status)&&!(o.production&&o.production.ready))}
function renderProduction(){let q=prodQueue();$("prodSelect").innerHTML=q.map(o=>`<option value="${o.id}">${o.number} · ${o.client}</option>`).join("");if(!prodId&&q[0])prodId=q[0].id;if(prodId)$("prodSelect").value=prodId;let o=db.orders.find(x=>x.id==prodId);if(!o){$("prodView").innerHTML="<div class='panel'>Aucune production en cours.</div>";return}let cuts=group(o.items);o.production=o.production||{};$("prodView").innerHTML=`<div class="prod-card ${o.priority==="Urgent"?"urgent":""}"><div class="row"><div><h3>${o.client}</h3><small>${o.number} · ${o.delivery||"-"}</small></div><button onclick="editOrder(${o.id})">Modifier</button></div>${o.photo?`<img class="preview" src="${o.photo}">`:""}<h4>Articles</h4>${(o.items||[]).map(i=>`<div class="order"><b>${i.article} ${i.size||""} ${i.textileColor||""}</b><br>Logo : ${i.logo||"-"} ${i.logoColor||""}<br>Texte : ${i.firstname||"-"} ${i.firstnameColor||""}<br>Placement : ${i.placement||""}</div>`).join("")}<h4>Découpe HTV</h4>${Object.entries(cuts).map(([c,a])=>`<b>${c}</b><br>${a.map(x=>"☐ "+x).join("<br>")}<br>`).join("")||"Aucune découpe"}<div class="actions"><button class="wait" onclick="waiting()">Mettre en attente</button><button onclick="finishProd(${o.id})">Production terminée</button><button class="ghost" onclick="openDoc(${o.id},'production')">Bon production</button></div></div>`}
function finishProd(id){let o=db.orders.find(x=>x.id==id);o.production={ready:true};o.status="Terminé";o.history.push({date:new Date().toLocaleString("fr-FR"),text:"Production terminée"});prodId=null;save();showTab("done")}function group(items){let g={};items.forEach(i=>[[i.logoColor,i.logo],[i.firstnameColor,i.firstname]].forEach(([c,t])=>{if(t)(g[(c||"Sans couleur").trim()]??=[]).push(t)}));return g}
function renderDone(){let q=$("qDone").value.toLowerCase();let arr=db.orders.filter(o=>(o.archived||o.status==="Payé"||["Terminé","Livré"].includes(o.status)||o.production?.ready)&&(!q||JSON.stringify(o).toLowerCase().includes(q)));$("doneList").innerHTML=arr.map(o=>card(o,"done")).join("")||"<p>Aucune terminée.</p>"}
function markPaid(id){let o=db.orders.find(x=>x.id==id);o.deposit=o.total;o.status="Payé";o.archived=true;o.production=o.production||{};o.production.ready=true;o.history.push({date:new Date().toLocaleString("fr-FR"),text:"Payée et archivée"});save();payMode="paid";showTab("payments")}
function renderPayments(){let all=db.orders, paid=all.filter(o=>o.status==="Payé"||rest(o)<=0), unpaid=all.filter(o=>!o.archived&&rest(o)>0&&o.status!=="Payé"), arr=payMode==="paid"?paid:unpaid;$("btnUnpaid").innerHTML=`Non payées (${unpaid.length})`;$("btnPaid").innerHTML=`Payées (${paid.length})`;$("paymentsList").innerHTML=arr.map(o=>`<div class="payment ${payMode==="paid"?'done':'unpaid'}"><div class="row"><div><b>${o.client}</b><br>${o.number||""}</div><button onclick="editOrder(${o.id})">Voir</button></div><p>Total ${euro(o.total)} · Acompte ${euro(o.deposit)} · <b>${payMode==="paid"?'PAYÉ':'Reste '+euro(rest(o))}</b></p><div class="actions">${payMode==="paid"?`<button onclick="openDoc(${o.id},'invoice')">Facture</button><button class="ghost" onclick="editOrder(${o.id})">Modifier</button>`:`<button onclick="markPaid(${o.id})">Marquer payé</button><button class="ghost" onclick="openDoc(${o.id},'invoice')">Facture</button>`}</div></div>`).join("")||"<p>Aucune commande.</p>"}
function renderDashboard(){let a=active(),unpaid=a.filter(o=>rest(o)>0),waiting=db.orders.filter(o=>!o.archived&&(o.waiting||o.status==="En attente client"));$("kOrders").textContent=a.length;$("kWaiting").textContent=waiting.length;$("kProd").textContent=prodQueue().length;$("kUnpaid").textContent=unpaid.length;$("kCA").textContent=euro(db.orders.reduce((s,o)=>s+(+o.total||0),0));$("kRest").textContent=euro(unpaid.reduce((s,o)=>s+rest(o),0));$("dashTodo").innerHTML=[...waiting,...prodQueue()].slice(0,6).map(o=>card(o,o.waiting?"waiting":"")).join("")||"<p>Rien à traiter.</p>";$("dashSoon").innerHTML=a.filter(o=>o.delivery).sort((x,y)=>x.delivery.localeCompare(y.delivery)).slice(0,6).map(o=>card(o)).join("")||"<p>Aucune livraison.</p>"}
function renderStock(){$("stockList").innerHTML=db.stock.map((s,i)=>`<div class="stockcard ${s.qty<=s.min?'urgent':''}"><div class="row"><b>${s.name}</b><button class="danger" onclick="db.stock.splice(${i},1);save()">X</button></div>${s.type} · ${s.qty} restant · seuil ${s.min}<div class="actions"><button onclick="db.stock[${i}].qty++;save()">+1</button><button class="ghost" onclick="db.stock[${i}].qty=Math.max(0,db.stock[${i}].qty-1);save()">-1</button></div></div>`).join("")||"<p>Aucun stock.</p>"}function addStock(){let n=$("stockName").value.trim();if(!n)return;db.stock.push({name:n,type:$("stockType").value,qty:+$("stockQty").value||0,min:+$("stockMin").value||0});$("stockName").value="";save()}
function renderFinance(){let ca=db.orders.reduce((s,o)=>s+(+o.total||0),0),cost=db.orders.reduce((s,o)=>s+(+o.cost||0),0),restSum=active().reduce((s,o)=>s+rest(o),0);$("financeView").innerHTML=`<div class="kpis"><div class="kpi"><b>${euro(ca)}</b><span>CA</span></div><div class="kpi"><b>${euro(cost)}</b><span>Coûts</span></div><div class="kpi"><b>${euro(ca-cost)}</b><span>Bénéfice</span></div><div class="kpi"><b>${euro(restSum)}</b><span>À encaisser</span></div></div>`}
function renderClients(){let q=$("qClients").value.toLowerCase(),m={};db.orders.forEach(o=>{m[o.client]??={count:0,total:0,phone:o.phone};m[o.client].count++;m[o.client].total+=+o.total||0});$("clientsList").innerHTML=Object.entries(m).filter(([n])=>n.toLowerCase().includes(q)).map(([n,c])=>`<div class="client"><b>${n}</b><br>${c.phone||""}<br>${c.count} commande(s) · ${euro(c.total)}</div>`).join("")||"<p>Aucun client.</p>"}
function renderSettings(){let s=db.settings;$("setBusiness").value=s.business||"";$("setDesc").value=s.desc||"";$("setPhone").value=s.phone||"";$("setEmail").value=s.email||"";$("dataState").innerHTML=`${db.orders.length} commandes · ${db.stock.length} stocks`}
function doc(o,t){if(t==="label")return`<div class="doc labeldoc"><h1>JEREM CUSTOM</h1><h2>${o.client}</h2><p>${o.phone||""}</p><p>${o.number||""}<br>${o.delivery||""}</p>${o.items.map(i=>`${i.article} ${i.size||""} ${i.firstname||i.logo||""}`).join("<br>")}</div>`;let show=t!=="production",cuts=group(o.items);return`<div class="doc"><h1>${t==="invoice"?"FACTURE":t==="quote"?"DEVIS":"BON DE PRODUCTION"}</h1><p><b>${db.settings.business||"Jerem Custom"}</b><br>${db.settings.desc||""}</p>${o.photo?`<img src="${o.photo}">`:""}<p><b>${o.number}</b><br>${o.client}<br>${o.phone||""}<br>Livraison ${o.delivery||""}</p><table><tr><th>Article</th><th>Taille</th><th>Logo</th><th>Texte</th>${show?"<th>Prix</th>":""}</tr>${o.items.map(i=>`<tr><td>${i.article}</td><td>${i.size}</td><td>${i.logo} ${i.logoColor||""}</td><td>${i.firstname} ${i.firstnameColor||""}</td>${show?`<td>${euro(i.price)}</td>`:""}</tr>`).join("")}</table>${t==="production"?Object.entries(cuts).map(([c,a])=>`<h3>${c}</h3>${a.map(x=>"☐ "+x).join("<br>")}`).join(""):`<h2>Total ${euro(o.total)}</h2><p>Reste ${euro(rest(o))}</p>`}</div>`}
function openDoc(id,t){docId=id;docType=t;$("docContent").innerHTML=doc(db.orders.find(o=>o.id==id),t);$("docModal").classList.add("open")}function setDoc(t){openDoc(docId,t)}function closeDoc(){$("docModal").classList.remove("open")}function printDoc(){let o=db.orders.find(x=>x.id==docId),content=doc(o,docType);let w=window.open("","_blank");w.document.write(`<html><head><style>body{font-family:Arial;padding:20px}.doc h1{color:#0b5fff;border-bottom:3px solid #0b5fff}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bfdbfe;padding:8px}.labeldoc{border:2px dashed #0b5fff;padding:20px;max-width:430px}</style></head><body>${content}<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script></body></html>`);w.document.close()}
function exportData(){let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:"application/json"}));a.download="jerem-custom-sauvegarde-final.json";a.click()}function importData(f){let r=new FileReader();r.onload=()=>{db=clean(JSON.parse(r.result));save()};r.readAsText(f)}
function renderAll(){db.orders.forEach(autoPaid);renderDashboard();renderOrders();renderWaiting();renderProduction();renderDone();renderPayments();renderStock();renderFinance();renderClients();renderSettings()}
$("newBtn").onclick=()=>{resetEditor();showTab("editor")};$("exportBtn").onclick=exportData;$("addItem").onclick=()=>addItem(null);$("saveOrder").onclick=saveOrder;$("duplicate").onclick=duplicate;$("archive").onclick=archive;$("deleteOrder").onclick=del;$("sendWaiting").onclick=waiting;$("applyQuick").onclick=()=>{[...$("items").children].forEach(el=>{if($("quickLogo").value)el.querySelector(".l").value=$("quickLogo").value;if($("quickLogoColor").value)el.querySelector(".lc").value=$("quickLogoColor").value;if($("quickPlacement").value)el.querySelector(".p").value=$("quickPlacement").value;if(+$("quickPrice").value)el.querySelector(".pr").value=$("quickPrice").value});calc()};$("cost").oninput=calc;$("photo").onchange=()=>photo(r=>$("photoPreview").innerHTML=r?`<img class="preview" src="${r}">`:"");["qOrders","fStatus","fPriority"].forEach(id=>$(id).oninput=renderOrders);$("qWaiting").oninput=renderWaiting;$("prodSelect").onchange=()=>{prodId=+$("prodSelect").value;renderProduction()};$("openProd").onclick=()=>{prodId=+$("prodSelect").value;renderProduction()};$("qDone").oninput=renderDone;$("btnUnpaid").onclick=()=>{payMode="unpaid";$("btnUnpaid").classList.add("active");$("btnPaid").classList.remove("active");renderPayments()};$("btnPaid").onclick=()=>{payMode="paid";$("btnPaid").classList.add("active");$("btnUnpaid").classList.remove("active");renderPayments()};$("addStock").onclick=addStock;$("qClients").oninput=renderClients;$("saveSettings").onclick=()=>{db.settings={business:$("setBusiness").value,desc:$("setDesc").value,phone:$("setPhone").value,email:$("setEmail").value};save()};$("exportData").onclick=exportData;$("importData").onchange=e=>importData(e.target.files[0]);$("clearData").onclick=()=>{if(confirm("Tout effacer ?")){localStorage.removeItem(STORE);db=empty();save()}};resetEditor();renderAll();if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");

/* === PATCH FINAL PAIEMENT : Payé = reste 0 € / affichage propre === */
function isPaidOrder(o){
  return !!o && (o.status === "Payé" || o.payment === "Payé" || o.paymentMethod === "Payé");
}

const __oldRest = typeof rest === "function" ? rest : null;
rest = function(o){
  if(isPaidOrder(o)) return 0;
  return Math.max(0,(+o.total||0)-(+o.deposit||0)-paidFor(o.id));
};

const __oldAutoPaid = typeof autoPaid === "function" ? autoPaid : null;
autoPaid = function(o){
  if(!o) return;
  if(isPaidOrder(o) || (rest(o)<=0 && (+o.total||0)>0)){
    o.status = "Payé";
    o.payment = o.payment || "Non défini";
    o.deposit = +o.total || 0;
    o.archived = true;
    o.production = o.production || {};
    o.production.ready = true;
    o.waiting = false;
  }
};

const __oldMarkPaid = typeof markPaid === "function" ? markPaid : null;
markPaid = function(id){
  let o = db.orders.find(x=>x.id==id);
  if(!o) return;
  o.deposit = +o.total || 0;
  o.status = "Payé";
  o.archived = true;
  o.production = o.production || {};
  o.production.ready = true;
  o.waiting = false;
  o.history = o.history || [];
  o.history.push({date:new Date().toLocaleString("fr-FR"),text:"Payée et archivée"});
  save();
  payMode = "paid";
  showTab("payments");
};

function paymentBadgeHTML(o){
  if(isPaidOrder(o) || rest(o)<=0){
    return '<span class="badge green">Payé</span>';
  }
  return '<span class="badge red">Reste '+euro(rest(o))+'</span>';
}

const __oldCard = typeof card === "function" ? card : null;
card = function(o,cls=""){
  return `<div class="order ${cls} ${o.priority==="Urgent"?"urgent":""}">
    <div class="row">
      <div><b>${o.client}</b><br><small>${o.number||""} · ${o.status||""} · ${o.delivery||"-"}</small></div>
      <div><button onclick="editOrder(${o.id})">Ouvrir</button><button class="ghost" onclick="openDoc(${o.id},'production')">Imprimer</button></div>
    </div>
    <div><span class="badge">${euro(o.total)}</span>${paymentBadgeHTML(o)}</div>
    <div>${(o.items||[]).map(i=>`<span class="badge">${i.article} ${i.size||""} ${i.firstname||i.logo||""}</span>`).join("")}</div>
  </div>`;
};

const __oldRenderAll = typeof renderAll === "function" ? renderAll : null;
renderAll = function(){
  db.orders.forEach(autoPaid);
  localStorage.setItem(STORE, JSON.stringify(db));
  renderDashboard();
  renderOrders();
  renderWaiting();
  renderProduction();
  renderDone();
  renderPayments();
  renderStock();
  renderFinance();
  renderClients();
  renderSettings();
};
renderAll();


function shareBackupMobile(){
  try{
    const data = JSON.stringify(db,null,2);
    const file = new File([data], "jerem-custom-sauvegarde-mobile.json", {type:"application/json"});
    if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
      navigator.share({title:"Sauvegarde Jerem Custom", text:"Sauvegarde Jerem Custom", files:[file]}).catch(()=>exportData());
    }else{
      exportData();
    }
  }catch(e){
    exportData();
  }
}


document.addEventListener("DOMContentLoaded",()=>{
  ["exportBtn","exportData","quickSave"].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.onclick=shareBackupMobile;
  });
});
