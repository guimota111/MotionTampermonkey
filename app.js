// ==========================================================================
//  Meus Scripts Tampermonkey — organizador pessoal
//  Firebase Firestore (SDK modular via CDN — funciona em hospedagem estática)
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, writeBatch, getDocs
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// --- Configuração do Firebase ---------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBL41RKXQUFJOAxl1QpdripKGyrZWw_r50",
  authDomain: "scriptstampermonkey-e3570.firebaseapp.com",
  projectId: "scriptstampermonkey-e3570",
  storageBucket: "scriptstampermonkey-e3570.firebasestorage.app",
  messagingSenderId: "489478202420",
  appId: "1:489478202420:web:6988ee0bba4f5921269661",
  measurementId: "G-6G8SS9NW71"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const categoriesCol = collection(db, "categories");
const scriptsCol = collection(db, "scripts");

// --- Estado ----------------------------------------------------------------
let categories = [];
let scripts = [];
let searchTerm = "";
const openScripts = new Set();

// --- Utilidades ------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const el = (id) => document.getElementById(id);

function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

let toastTimer;
function toast(msg) {
  const t = el("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2500);
}

function setStatus(msg, isError = false) {
  const s = el("status");
  if (!msg) { s.hidden = true; return; }
  s.hidden = false;
  s.textContent = msg;
  s.classList.toggle("error", isError);
}

// --- Assinaturas em tempo real ---------------------------------------------
function subscribe() {
  setStatus("Conectando ao Firebase…");
  let firstCat = false, firstScr = false;

  onSnapshot(query(categoriesCol, orderBy("createdAt", "asc")),
    (snap) => {
      categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      firstCat = true;
      if (firstCat) setStatus("");
      render();
    },
    (err) => onSubError(err));

  onSnapshot(query(scriptsCol, orderBy("createdAt", "asc")),
    (snap) => {
      scripts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      firstScr = true;
      render();
    },
    (err) => onSubError(err));
}

function onSubError(err) {
  console.error(err);
  setStatus(
    "Erro ao conectar ao Firestore: " + err.message +
    ". Verifique se o Firestore está ativado e as regras permitem leitura/escrita (veja o README).",
    true
  );
}

// --- Renderização ----------------------------------------------------------
function render() {
  const content = el("content");
  const empty = el("empty");
  const term = searchTerm.trim().toLowerCase();

  if (categories.length === 0 && scripts.length === 0) {
    content.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  // scripts sem categoria (categoria removida) vão para "Sem categoria"
  const knownCatIds = new Set(categories.map((c) => c.id));
  const groups = categories.map((c) => ({ cat: c, list: [] }));
  const orphan = { cat: { id: "__none__", name: "Sem categoria" }, list: [] };

  for (const s of scripts) {
    if (term) {
      const hay = (s.name + " " + (s.description || "")).toLowerCase();
      if (!hay.includes(term)) continue;
    }
    const g = groups.find((x) => x.cat.id === s.categoryId);
    (g || orphan).list.push(s);
  }
  if (orphan.list.length) groups.push(orphan);

  content.innerHTML = groups.map(renderCategory).join("");
  bindDynamic();
}

function renderCategory({ cat, list }) {
  const isOrphan = cat.id === "__none__";
  const scriptsHtml = list.length
    ? list.map(renderScript).join("")
    : `<div class="category-empty">Nenhum script nessa categoria ainda.</div>`;

  return `
  <section class="category" data-cat="${esc(cat.id)}">
    <div class="category-head">
      <h2>${esc(cat.name)}</h2>
      <span class="category-count">${list.length}</span>
      ${isOrphan ? "" : `
      <div class="category-actions">
        <button class="icon-btn" data-action="add-script-to" data-cat="${esc(cat.id)}" title="Novo script aqui">＋</button>
        <button class="icon-btn" data-action="edit-cat" data-cat="${esc(cat.id)}" title="Renomear">✎</button>
        <button class="icon-btn" data-action="del-cat" data-cat="${esc(cat.id)}" title="Excluir categoria">🗑</button>
      </div>`}
    </div>
    <div class="category-scripts">${scriptsHtml}</div>
  </section>`;
}

function renderScript(s) {
  const versions = [...(s.versions || [])].sort(sortVersionsDesc);
  const latest = versions[0];
  const isOpen = openScripts.has(s.id);

  return `
  <div class="script ${isOpen ? "open" : ""}" data-script="${esc(s.id)}">
    <div class="script-head" data-action="toggle" data-script="${esc(s.id)}">
      <span class="script-chevron">▶</span>
      <div class="script-main">
        <div class="script-name">${esc(s.name)}</div>
        ${s.description ? `<div class="script-desc">${esc(s.description)}</div>` : ""}
      </div>
      ${s.fields && s.fields.length ? `<span class="chip-campos" title="Tem ${s.fields.length} campo(s) para preencher">🧩</span>` : ""}
      ${latest ? `<span class="badge">v${esc(latest.version)}</span>` : `<span class="badge" style="color:var(--text-faint);background:none;border-color:var(--border)">sem versão</span>`}
      <div class="script-head-actions">
        <button class="icon-btn" data-action="edit-script" data-script="${esc(s.id)}" title="Editar">✎</button>
        <button class="icon-btn" data-action="del-script" data-script="${esc(s.id)}" title="Excluir">🗑</button>
      </div>
    </div>
    ${isOpen ? renderScriptBody(s, versions) : ""}
  </div>`;
}

function renderScriptBody(s, versions) {
  const versionsHtml = versions.length
    ? versions.map((v, i) => renderVersion(s, v, i === 0)).join("")
    : `<div class="category-empty">Nenhuma versão registrada. Adicione a primeira!</div>`;

  return `
  <div class="script-body">
    ${renderCamposPanel(s)}
    <div class="versions-head">
      <h4>Versões & Changelog</h4>
      <button class="btn btn-ghost btn-sm" data-action="add-version" data-script="${esc(s.id)}">+ Nova versão</button>
    </div>
    ${versionsHtml}
  </div>`;
}

// Painel onde o usuário preenche os campos antes de copiar
function renderCamposPanel(s) {
  if (!s.fields || !s.fields.length) return "";
  const vals = getCampoValues(s.id);
  const inputs = s.fields.map((f) => {
    const val = vals[f.id] != null ? vals[f.id] : "";
    const ph = esc(f.placeholder || "");
    const attrs = `class="campo-control${f.type === "textarea" ? " mono" : ""}" data-script="${esc(s.id)}" data-field="${esc(f.id)}" placeholder="${ph}" autocomplete="off"`;
    const control = f.type === "textarea"
      ? `<textarea rows="3" ${attrs}>${esc(val)}</textarea>`
      : `<input type="${f.type === "password" ? "password" : "text"}" value="${esc(val)}" ${attrs} />`;
    return `
      <label class="campo-field">
        <span class="campo-label">${esc(f.label || f.placeholder || "Campo")}</span>
        ${control}
      </label>`;
  }).join("");

  return `
  <div class="campos-panel">
    <div class="campos-panel-head">🧩 Campos — preencha antes de copiar</div>
    <div class="campos-grid">${inputs}</div>
    <div class="campos-note">Os valores ficam salvos só no seu navegador. Ao <strong>Ver código</strong> ou <strong>Copiar</strong>, os marcadores são substituídos automaticamente.</div>
  </div>`;
}

function renderVersion(s, v, isLatest) {
  return `
  <div class="version">
    <div class="version-top">
      <span class="version-tag">v${esc(v.version)}</span>
      ${isLatest ? `<span class="version-latest">atual</span>` : ""}
      ${v.createdAt ? `<span class="version-date">${esc(fmtDate(v.createdAt))}</span>` : ""}
    </div>
    ${v.changelog ? `<div class="version-changelog">${esc(v.changelog)}</div>` : ""}
    <div class="version-actions">
      ${v.code ? `<button class="btn btn-primary btn-sm" data-action="install-version" data-script="${esc(s.id)}" data-version="${esc(v.id)}" title="Instalar no Tampermonkey com os campos preenchidos">⚡ Instalar</button>` : ""}
      ${v.code ? `<button class="btn btn-ghost btn-sm" data-action="view-code" data-script="${esc(s.id)}" data-version="${esc(v.id)}">Ver código</button>` : ""}
      ${v.code ? `<button class="btn btn-ghost btn-sm" data-action="copy-version" data-script="${esc(s.id)}" data-version="${esc(v.id)}">Copiar</button>` : ""}
      <button class="btn btn-danger btn-sm" data-action="del-version" data-script="${esc(s.id)}" data-version="${esc(v.id)}">Excluir versão</button>
    </div>
  </div>`;
}

// Ordena versões: por data (mais recente primeiro), fallback semântico
function sortVersionsDesc(a, b) {
  const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
  const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
  if (ta !== tb) return tb - ta;
  return cmpSemver(b.version, a.version);
}
function cmpSemver(a, b) {
  const pa = String(a).split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

function findScript(id) { return scripts.find((s) => s.id === id); }
function findVersion(scriptId, versionId) {
  return (findScript(scriptId)?.versions || []).find((v) => v.id === versionId);
}

// --- Campos personalizáveis -------------------------------------------------
// Os VALORES preenchidos ficam só no navegador (localStorage), nunca no Firestore.
function camposKey(scriptId) { return `motionscripts:campos:${scriptId}`; }
function getCampoValues(scriptId) {
  try { return JSON.parse(localStorage.getItem(camposKey(scriptId)) || "{}"); }
  catch { return {}; }
}
function setCampoValue(scriptId, fieldId, value) {
  const all = getCampoValues(scriptId);
  all[fieldId] = value;
  try { localStorage.setItem(camposKey(scriptId), JSON.stringify(all)); } catch {}
}
// Substitui cada marcador (placeholder) pelo valor digitado
function aplicarCampos(code, script) {
  const vals = getCampoValues(script.id);
  let out = code || "";
  (script.fields || []).forEach((f) => {
    const v = vals[f.id];
    if (v != null && v !== "" && f.placeholder) {
      out = out.split(f.placeholder).join(v);
    }
  });
  return out;
}
function camposFaltando(script) {
  const vals = getCampoValues(script.id);
  return (script.fields || []).filter((f) => !vals[f.id] && vals[f.id] !== 0);
}

// --- Ações vinculadas dinamicamente ----------------------------------------
function bindDynamic() {
  document.querySelectorAll("[data-action]").forEach((node) => {
    node.onclick = (e) => {
      e.stopPropagation();
      const { action, script, cat, version } = node.dataset;
      handleAction(action, { script, cat, version });
    };
  });
  // Inputs de campos: salvam no navegador conforme digita
  document.querySelectorAll(".campo-control").forEach((node) => {
    node.oninput = () => setCampoValue(node.dataset.script, node.dataset.field, node.value);
    node.onclick = (e) => e.stopPropagation();
  });
}

async function handleAction(action, { script, cat, version }) {
  switch (action) {
    case "toggle":
      openScripts.has(script) ? openScripts.delete(script) : openScripts.add(script);
      render();
      break;
    case "add-script-to": openScriptDialog(null, cat); break;
    case "edit-cat": openCategoryDialog(categories.find((c) => c.id === cat)); break;
    case "del-cat": await deleteCategory(cat); break;
    case "edit-script": openScriptDialog(findScript(script)); break;
    case "del-script": await deleteScript(script); break;
    case "add-version": openVersionDialog(script); break;
    case "del-version": await deleteVersion(script, version); break;
    case "install-version": installCode(script, version); break;
    case "view-code": showCode(script, version); break;
    case "copy-version": copyCode(script, version); break;
  }
}

// --- CRUD: Categorias ------------------------------------------------------
function openCategoryDialog(existing = null) {
  const dlg = el("dlg-category");
  const form = el("form-category");
  form.reset();
  el("dlg-category-title").textContent = existing ? "Renomear categoria" : "Nova categoria";
  form.name.value = existing?.name || "";
  form.id.value = existing?.id || "";
  dlg.showModal();
}

el("form-category").addEventListener("submit", async (e) => {
  const form = e.target;
  const name = form.name.value.trim();
  if (!name) return;
  const id = form.id.value;
  try {
    if (id) {
      await updateDoc(doc(db, "categories", id), { name });
      toast("Categoria atualizada");
    } else {
      await addDoc(categoriesCol, { name, createdAt: serverTimestamp() });
      toast("Categoria criada");
    }
  } catch (err) { toast("Erro: " + err.message); }
});

async function deleteCategory(catId) {
  const inCat = scripts.filter((s) => s.categoryId === catId);
  const msg = inCat.length
    ? `Excluir esta categoria? Os ${inCat.length} script(s) dentro dela ficarão em "Sem categoria".`
    : "Excluir esta categoria?";
  if (!confirm(msg)) return;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, "categories", catId));
    inCat.forEach((s) => batch.update(doc(db, "scripts", s.id), { categoryId: "__none__" }));
    await batch.commit();
    toast("Categoria excluída");
  } catch (err) { toast("Erro: " + err.message); }
}

// --- CRUD: Scripts ---------------------------------------------------------
function fillCategorySelect(selected) {
  const sel = el("form-script").categoryId;
  sel.innerHTML = categories.map((c) =>
    `<option value="${esc(c.id)}" ${c.id === selected ? "selected" : ""}>${esc(c.name)}</option>`).join("");
}

function openScriptDialog(existing = null, presetCat = null) {
  if (categories.length === 0) {
    toast("Crie uma categoria primeiro");
    openCategoryDialog();
    return;
  }
  const dlg = el("dlg-script");
  const form = el("form-script");
  form.reset();
  el("dlg-script-title").textContent = existing ? "Editar script" : "Novo script";
  fillCategorySelect(existing?.categoryId || presetCat || categories[0]?.id);
  form.name.value = existing?.name || "";
  form.description.value = existing?.description || "";
  form.id.value = existing?.id || "";
  // Ao editar não mostramos o campo de primeira versão
  el("script-first-version").style.display = existing ? "none" : "block";
  // Popular o editor de campos
  el("campos-editor").innerHTML = "";
  (existing?.fields || []).forEach((f) => camposEditorAddRow(f));
  dlg.showModal();
}

// Adiciona uma linha ao editor de campos do modal
function camposEditorAddRow(field = {}) {
  const wrap = el("campos-editor");
  const row = document.createElement("div");
  row.className = "campo-editor-row";
  row.dataset.fieldId = field.id || uid();
  row.innerHTML = `
    <input class="ce-label" placeholder="Rótulo (ex: Endpoint)" value="${esc(field.label || "")}" />
    <input class="ce-placeholder mono" placeholder="Marcador no código (ex: INSERIR ENDPOINT…)" value="${esc(field.placeholder || "")}" />
    <select class="ce-type">
      <option value="text">Texto</option>
      <option value="password">Senha</option>
      <option value="textarea">Multi-linha</option>
    </select>
    <button type="button" class="icon-btn ce-remove" title="Remover campo">🗑</button>
  `;
  row.querySelector(".ce-type").value = field.type || "text";
  row.querySelector(".ce-remove").onclick = () => row.remove();
  wrap.appendChild(row);
}

// Lê as linhas do editor e devolve o array de campos
function coletarCampos() {
  return [...el("campos-editor").querySelectorAll(".campo-editor-row")]
    .map((row) => ({
      id: row.dataset.fieldId,
      label: row.querySelector(".ce-label").value.trim(),
      placeholder: row.querySelector(".ce-placeholder").value,
      type: row.querySelector(".ce-type").value
    }))
    .filter((f) => f.placeholder.trim() !== "");
}

el("form-script").addEventListener("submit", async (e) => {
  const form = e.target;
  const name = form.name.value.trim();
  if (!name) return;
  const id = form.id.value;
  const data = {
    name,
    description: form.description.value.trim(),
    categoryId: form.categoryId.value,
    fields: coletarCampos()
  };
  try {
    if (id) {
      await updateDoc(doc(db, "scripts", id), data);
      toast("Script atualizado");
    } else {
      const versions = [];
      const ver = form.version.value.trim();
      const code = form.code.value;
      const changelog = form.changelog.value.trim();
      if (ver || code.trim() || changelog) {
        versions.push({
          id: uid(),
          version: ver || "1.0.0",
          changelog: changelog || "Versão inicial",
          code,
          createdAt: new Date()
        });
      }
      const ref = await addDoc(scriptsCol, { ...data, versions, createdAt: serverTimestamp() });
      openScripts.add(ref.id);
      render();
      toast("Script criado");
    }
  } catch (err) { toast("Erro: " + err.message); }
});

async function deleteScript(id) {
  const s = findScript(id);
  if (!confirm(`Excluir o script "${s?.name}" e todas as suas versões?`)) return;
  try {
    await deleteDoc(doc(db, "scripts", id));
    openScripts.delete(id);
    toast("Script excluído");
  } catch (err) { toast("Erro: " + err.message); }
}

// --- CRUD: Versões ---------------------------------------------------------
function openVersionDialog(scriptId) {
  const dlg = el("dlg-version");
  const form = el("form-version");
  form.reset();
  form.scriptId.value = scriptId;
  // sugere próxima versão
  const s = findScript(scriptId);
  const latest = [...(s?.versions || [])].sort(sortVersionsDesc)[0];
  if (latest) {
    const parts = String(latest.version).split(".").map((n) => parseInt(n, 10) || 0);
    parts[parts.length - 1] = (parts[parts.length - 1] || 0) + 1;
    form.version.value = parts.join(".");
    form.code.value = latest.code || "";
  }
  dlg.showModal();
}

el("form-version").addEventListener("submit", async (e) => {
  const form = e.target;
  const scriptId = form.scriptId.value;
  const s = findScript(scriptId);
  if (!s) return;
  const newVersion = {
    id: uid(),
    version: form.version.value.trim(),
    changelog: form.changelog.value.trim(),
    code: form.code.value,
    createdAt: new Date()
  };
  try {
    const versions = [...(s.versions || []), newVersion];
    await updateDoc(doc(db, "scripts", scriptId), { versions });
    openScripts.add(scriptId);
    render();
    toast("Versão adicionada");
  } catch (err) { toast("Erro: " + err.message); }
});

async function deleteVersion(scriptId, versionId) {
  const s = findScript(scriptId);
  if (!s) return;
  if (!confirm("Excluir esta versão?")) return;
  try {
    const versions = (s.versions || []).filter((v) => v.id !== versionId);
    await updateDoc(doc(db, "scripts", scriptId), { versions });
    toast("Versão excluída");
  } catch (err) { toast("Erro: " + err.message); }
}

// --- Ver / copiar / instalar código -----------------------------------------
function installCode(scriptId, versionId) {
  const s = findScript(scriptId);
  const v = findVersion(scriptId, versionId);
  if (!v || !v.code) return;

  // Substitui os campos personalizáveis pelos valores preenchidos pelo usuário no painel
  const processedCode = aplicarCampos(v.code, s);
  const faltando = camposFaltando(s);

  // Criar Blob com MIME type do Tampermonkey
  const blob = new Blob([processedCode], { type: "application/x-userscript;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  const safeName = (s.name || "script").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const fileName = `${safeName}-v${v.version}.user.js`;

  // 1. Tenta abrir a URL em nova aba (o Tampermonkey abre a tela de instalação se a extensão estiver ativa)
  try {
    window.open(blobUrl, "_blank");
  } catch (e) {
    console.log("window.open skipped", e);
  }

  // 2. Dispara o download do arquivo .user.js como garantia
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

  if (faltando.length) {
    toast(`⚡ Enviando ao Tampermonkey — ⚠️ ${faltando.length} campo(s) sem preencher`);
  } else if (s.fields && s.fields.length) {
    toast("⚡ Instalando no Tampermonkey com seus campos preenchidos!");
  } else {
    toast("⚡ Instalando no Tampermonkey!");
  }
}

function showCode(scriptId, versionId) {
  const s = findScript(scriptId);
  const v = findVersion(scriptId, versionId);
  if (!v) return;
  const code = aplicarCampos(v.code || "", s);
  const faltando = camposFaltando(s);
  el("dlg-code-title").textContent = s.name;
  el("dlg-code-meta").textContent = "v" + v.version +
    (faltando.length ? `  ·  ⚠️ ${faltando.length} campo(s) não preenchido(s)` : (s.fields?.length ? "  ·  ✅ campos preenchidos" : ""));
  el("dlg-code-body").textContent = code;
  el("btn-install-code").onclick = () => installCode(scriptId, versionId);
  el("btn-copy-code").onclick = () => copyText(code, msgCopia(faltando));
  el("dlg-code").showModal();
}

function copyCode(scriptId, versionId) {
  const s = findScript(scriptId);
  const v = findVersion(scriptId, versionId);
  if (!v) return;
  copyText(aplicarCampos(v.code || "", s), msgCopia(camposFaltando(s)));
}

function msgCopia(faltando) {
  return faltando.length
    ? `Copiado — ⚠️ ${faltando.length} campo(s) ainda vazio(s)`
    : "Código copiado";
}

async function copyText(text, msg) {
  try {
    await navigator.clipboard.writeText(text || "");
    toast(msg);
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text || "";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    toast(msg);
  }
}

// --- Ligações de UI estáticas ----------------------------------------------
el("btn-new-category").onclick = () => openCategoryDialog();
el("btn-empty-category").onclick = () => openCategoryDialog();
el("btn-new-script").onclick = () => openScriptDialog();
el("btn-add-campo").onclick = () => camposEditorAddRow();
el("search").addEventListener("input", (e) => { searchTerm = e.target.value; render(); });

// botões "Cancelar"/"Fechar" dentro dos dialogs
document.querySelectorAll("[data-close]").forEach((b) => {
  b.onclick = () => b.closest("dialog").close();
});

// --- Inicialização ---------------------------------------------------------
subscribe();
