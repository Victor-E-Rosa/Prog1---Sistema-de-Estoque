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

function produtosFiltrados() {
  const busca = $("busca").value.trim().toLowerCase();
  const cat = $("filtro-cat").value;
  return dados.produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca) && (!cat || p.cat === cat));
}

function renderEstoque() {
  const lista = produtosFiltrados();
  const t = $("tab-estoque");
  if (!lista.length) {
    t.innerHTML = `<tr><td class="vazio">Nenhum produto encontrado. Cadastre um produto na aba Cadastro.</td></tr>`;
  } else {
    t.innerHTML = `<tr><th>Produto</th><th>Categoria</th><th>Qtd.</th><th>Mínimo</th><th>Preço</th><th>Valor total</th><th>Ações</th></tr>` +
      lista.map((p) => `<tr class="${baixo(p) ? "baixo" : "normal"}">
        <td>${esc(p.nome)}</td><td>${esc(p.cat)}</td><td>${p.qtd}</td><td>${p.min}</td>
        <td>${moeda(p.preco)}</td><td>${moeda(p.qtd * p.preco)}</td>
        <td><button class="mini" data-editar="${p.id}">Editar</button>
            <button class="mini perigo" data-excluir="${p.id}">Excluir</button></td></tr>`).join("");
  }
  const itens = lista.reduce((s, p) => s + p.qtd, 0);
  const valor = lista.reduce((s, p) => s + p.qtd * p.preco, 0);
  $("total-estoque").textContent = `Total: ${itens} itens – ${moeda(valor)}`;
}

function renderSelects() {
  const cats = [...new Set(dados.produtos.map((p) => p.cat))].sort();
  $("categorias").innerHTML = cats.map((c) => `<option value="${esc(c)}">`).join("");
  const atual = $("filtro-cat").value;
  $("filtro-cat").innerHTML = `<option value="">Todas as categorias</option>` +
    cats.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  $("filtro-cat").value = cats.includes(atual) ? atual : "";
  $("m-produto").innerHTML = dados.produtos.length
    ? dados.produtos.map((p) => `<option value="${p.id}">${esc(p.nome)} (${p.qtd})</option>`).join("")
    : `<option value="">Cadastre um produto primeiro</option>`;
}

function renderTudo() {
  renderSelects();
  renderPainel();
  renderEstoque();
  tabelaMov("tab-historico", dados.historico);
}

function limparFormProduto() {
  $("form-produto").reset();
  $("p-id").value = "";
  $("titulo-form").textContent = "Novo produto";
  $("erro-produto").textContent = "";
}

$("form-produto").addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = $("p-nome").value.trim();
  const cat = $("p-cat").value.trim();
  const preco = parseFloat($("p-preco").value);
  const qtd = parseInt($("p-qtd").value, 10);
  const min = parseInt($("p-min").value, 10);
  const id = $("p-id").value;

  if (!nome || !cat) return ($("erro-produto").textContent = "Preencha o nome e a categoria.");
  if (isNaN(preco) || preco < 0) return ($("erro-produto").textContent = "Informe um preço válido (0 ou mais).");
  if (isNaN(qtd) || qtd < 0) return ($("erro-produto").textContent = "Informe uma quantidade válida (0 ou mais).");
  if (isNaN(min) || min < 0) return ($("erro-produto").textContent = "Informe um estoque mínimo válido (0 ou mais).");

  if (id) {
    Object.assign(dados.produtos.find((p) => p.id === id), { nome, cat, preco, qtd, min });
  } else {
    dados.produtos.push({ id: novoId(), nome, cat, preco, qtd, min });
  }
  salvar();
  limparFormProduto();
  renderTudo();
  irPara("estoque");
});
$("cancelar-produto").addEventListener("click", () => { limparFormProduto(); irPara("painel"); });

$("form-mov").addEventListener("submit", (e) => {
  e.preventDefault();
  const p = dados.produtos.find((x) => x.id === $("m-produto").value);
  const tipo = $("m-tipo").value;
  const qtd = parseInt($("m-qtd").value, 10);

  if (!p) return ($("erro-mov").textContent = "Cadastre um produto antes de registrar movimentações.");
  if (isNaN(qtd) || qtd < 1) return ($("erro-mov").textContent = "Informe uma quantidade maior que zero.");
  if (tipo === "saida" && qtd > p.qtd) return ($("erro-mov").textContent = `Saída maior que o estoque disponível (${p.qtd}).`);

  p.qtd += tipo === "entrada" ? qtd : -qtd;
  dados.historico.unshift({ data: new Date().toISOString(), produtoId: p.id, nome: p.nome, tipo, qtd });
  salvar();
  $("form-mov").reset();
  $("erro-mov").textContent = "";
  renderTudo();
  irPara("painel");
});
$("cancelar-mov").addEventListener("click", () => { $("form-mov").reset(); $("erro-mov").textContent = ""; irPara("painel"); });

$("tab-estoque").addEventListener("click", (e) => {
  const idEditar = e.target.dataset.editar;
  const idExcluir = e.target.dataset.excluir;
  if (idEditar) {
    const p = dados.produtos.find((x) => x.id === idEditar);
    $("p-id").value = p.id; $("p-nome").value = p.nome; $("p-cat").value = p.cat;
    $("p-preco").value = p.preco; $("p-qtd").value = p.qtd; $("p-min").value = p.min;
    $("titulo-form").textContent = "Editar produto";
    irPara("cadastro");
  }
  if (idExcluir) {
    const p = dados.produtos.find((x) => x.id === idExcluir);
    if (confirm(`Excluir "${p.nome}"? Essa ação não pode ser desfeita.`)) {
      dados.produtos = dados.produtos.filter((x) => x.id !== idExcluir);
      salvar();
      renderTudo();
    }
  }
});

$("busca").addEventListener("input", renderEstoque);
$("filtro-cat").addEventListener("change", renderEstoque);

$("exportar").addEventListener("click", () => {
  const linhas = [["Produto", "Categoria", "Quantidade", "Mínimo", "Preço", "Valor total"]];
  produtosFiltrados().forEach((p) => linhas.push([p.nome, p.cat, p.qtd, p.min, p.preco.toFixed(2), (p.qtd * p.preco).toFixed(2)]));
  const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "estoque.csv";
  a.click();
  URL.revokeObjectURL(a.href);
});

$("data").textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
carregar();
renderTudo();

window.stockOk = true;