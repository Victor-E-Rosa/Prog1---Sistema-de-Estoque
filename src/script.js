const CHAVE = "stockcontrol_v1";
let dados = { produtos: [], historico: [] };

function carregar() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) dados = JSON.parse(salvo);
  } catch (e) { console.error("Erro ao ler dados:", e); }
}
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(dados)); }
  catch (e) { console.error("Erro ao salvar dados:", e); }
}

const $ = (id) => document.getElementById(id);
const moeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const baixo = (p) => p.qtd <= p.min;
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function irPara(tela) {
  document.querySelectorAll(".tela").forEach((t) => t.classList.toggle("ativa", t.id === tela));
  document.querySelectorAll(".topo nav button").forEach((b) => b.classList.toggle("ativo", b.dataset.tela === tela));
}
document.querySelectorAll(".topo nav button").forEach((b) => b.addEventListener("click", () => irPara(b.dataset.tela)));
document.querySelectorAll("[data-ir]").forEach((b) => b.addEventListener("click", () => irPara(b.dataset.ir)));

function renderPainel() {
  const { produtos, historico } = dados;
  $("r-produtos").textContent = produtos.length;
  $("r-itens").textContent = produtos.reduce((s, p) => s + p.qtd, 0);
  $("r-valor").textContent = moeda(produtos.reduce((s, p) => s + p.qtd * p.preco, 0));
  const alertas = produtos.filter(baixo);
  $("r-baixo").textContent = alertas.length;

  $("lista-alertas").innerHTML = alertas.length
    ? alertas.map((p) => `<li><b>${esc(p.nome)}</b> – ${p.qtd} em estoque (mínimo ${p.min})</li>`).join("")
    : `<li class="vazio" style="background:none;border:0;padding:0">Nenhum produto abaixo do mínimo.</li>`;

  tabelaMov("tab-recentes", historico.slice(0, 5));
}

function tabelaMov(id, lista) {
  const t = $(id);
  if (!lista.length) { t.innerHTML = `<tr><td class="vazio">Nenhuma movimentação registrada.</td></tr>`; return; }
  t.innerHTML = `<tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Quantidade</th></tr>` +
    lista.map((m) => `<tr><td>${new Date(m.data).toLocaleString("pt-BR")}</td><td>${esc(m.nome)}</td>
      <td class="${m.tipo}">${m.tipo === "entrada" ? "Entrada" : "Saída"}</td><td>${m.qtd}</td></tr>`).join("");
}
