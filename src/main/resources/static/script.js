/**
 * ============================================================================
 * FRONTEND - SISTEMA DE CADASTRO E CATÁLOGO DE JOGOS (FETCH API)
 * Backend: Spring Boot + PostgreSQL em http://localhost:8080/jogo
 * ============================================================================
 */

// URL base do JogoController no backend
const API_URL = 'http://localhost:8080/jogo';

// Guarda o ID que estiver exibido no destaque da aba "Buscar por ID"
let idDestaqueAtual = null;

// ============================================================================
// FUNÇÕES UTILITÁRIAS (Formatação, Alertas e Segurança de HTML)
// ============================================================================

/**
 * Formata valores numéricos para o padrão monetário brasileiro (R$ 0,00).
 */
function formatarPrecoBRL(valor) {
    if (valor === null || valor === undefined || isNaN(Number(valor))) {
        return 'R$ 0,00';
    }
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

/**
 * Evita quebra de layout ou injeção de HTML caso o nome/gênero tenha caracteres especiais.
 */
function escaparHTML(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Exibe mensagens claras de sucesso ou erro no topo da tela.
 * @param {string} mensagem - Texto exibido no alerta.
 * @param {'success'|'danger'|'warning'|'info'} tipo - Estilo Bootstrap do alerta.
 */
function exibirMensagem(mensagem, tipo = 'success') {
    const areaAlerta = document.getElementById('area-alerta');
    const icone =
        tipo === 'success'
            ? 'bi-check-circle-fill'
            : tipo === 'danger'
                ? 'bi-exclamation-triangle-fill'
                : 'bi-info-circle-fill';

    areaAlerta.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show shadow-sm d-flex align-items-center" role="alert">
      <i class="bi ${icone} me-2 fs-5"></i>
      <div>${mensagem}</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    </div>
  `;
}

// ============================================================================
// OPERAÇÃO 2: LISTAR TODOS OS JOGOS OU BUSCAR COM FILTROS (GET)
// Rota: GET http://localhost:8080/jogo
// Com filtros opcionais: GET http://localhost:8080/jogo?nome=...&plataforma=...
// ============================================================================

/**
 * Busca os jogos no backend usando o verbo HTTP GET.
 * Utiliza URLSearchParams para incluir na URL APENAS os filtros preenchidos,
 * evitando enviar parâmetros vazios (?nome=) que afetariam o ExampleMatcher.
 */
async function listarJogos(filtros = {}) {
    const containerLista = document.getElementById('lista-jogos');
    const contadorJogos = document.getElementById('contador-jogos');

    try {
        // URLSearchParams monta a query string de forma segura e limpa
        const params = new URLSearchParams();

        if (filtros.nome && filtros.nome.trim() !== '') {
            params.append('nome', filtros.nome.trim());
        }
        if (filtros.genero && filtros.genero.trim() !== '') {
            params.append('genero', filtros.genero.trim());
        }
        if (filtros.plataforma && filtros.plataforma.trim() !== '') {
            params.append('plataforma', filtros.plataforma.trim());
        }
        if (filtros.preco !== undefined && filtros.preco !== null && String(filtros.preco).trim() !== '') {
            const precoNumerico = parseFloat(filtros.preco);
            if (!isNaN(precoNumerico)) {
                params.append('preco', precoNumerico);
            }
        }

        // Se houver parâmetros preenchidos, anexa "?chave=valor"; caso contrário, usa apenas API_URL
        const queryString = params.toString();
        const urlFinal = queryString ? `${API_URL}?${queryString}` : API_URL;

        // Requisição GET padrão do fetch (não possui body)
        const response = await fetch(urlFinal, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP ao listar jogos: ${response.status}`);
        }

        // Converte o JSON retornado (status 200 OK) em um array de objetos Jogo
        const jogos = await response.json();
        contadorJogos.textContent = jogos.length;

        // Renderiza os cards na tela
        if (jogos.length === 0) {
            containerLista.innerHTML = `
        <div class="col-12">
          <div class="gamer-panel p-5 text-center text-secondary">
            <i class="bi bi-joystick fs-1 d-block mb-2 text-cyan"></i>
            <p class="mb-0">Nenhum jogo encontrado no catálogo com os critérios informados.</p>
          </div>
        </div>
      `;
            return;
        }

        containerLista.innerHTML = jogos
            .map(
                (jogo) => `
        <div class="col-md-6 col-lg-4">
          <article class="game-card h-100 p-4 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
                <span class="game-id-pill">ID #${jogo.id}</span>
                <div class="d-flex flex-wrap gap-1 justify-content-end">
                  <span class="badge badge-genero">${escaparHTML(jogo.genero)}</span>
                  <span class="badge badge-plataforma">${escaparHTML(jogo.plataforma)}</span>
                </div>
              </div>

              <h3 class="h5 fw-bold text-white mb-3">${escaparHTML(jogo.nome)}</h3>
            </div>

            <div class="pt-3 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
              <span class="game-price">${formatarPrecoBRL(jogo.preco)}</span>

              <div class="btn-group btn-group-sm" role="group" aria-label="Ações do jogo">
                <button
                  type="button"
                  class="btn btn-outline-info"
                  title="Editar este jogo"
                  onclick='prepararEdicao(${JSON.stringify(jogo)})'
                >
                  <i class="bi bi-pencil-square"></i> Editar
                </button>
                <button
                  type="button"
                  class="btn btn-outline-danger"
                  title="Excluir este jogo"
                  onclick="deletarJogo(${jogo.id})"
                >
                  <i class="bi bi-trash3"></i> Excluir
                </button>
              </div>
            </div>
          </article>
        </div>
      `
            )
            .join('');
    } catch (erro) {
        console.error('Falha ao buscar catálogo:', erro);
        exibirMensagem(
            'Não foi possível carregar o catálogo. Verifique se o backend está rodando em <strong>http://localhost:8080/jogo</strong>.',
            'danger'
        );
    }
}

// ============================================================================
// OPERAÇÃO 1: CADASTRAR JOGO (POST)
// Rota: POST http://localhost:8080/jogo
// ============================================================================

/**
 * Envia um novo jogo em formato JSON usando o verbo HTTP POST.
 * Não enviamos o campo "id", pois o PostgreSQL o gera automaticamente.
 * Lemos o retorno (status 201 Created) via response.json() para exibir o ID gerado.
 */
async function cadastrarJogo(event) {
    event.preventDefault();

    const nome = document.getElementById('cad-nome').value.trim();
    const genero = document.getElementById('cad-genero').value.trim();
    const plataforma = document.getElementById('cad-plataforma').value.trim();
    const preco = parseFloat(document.getElementById('cad-preco').value);

    // Objeto JSON exatamente com os atributos esperados pelo backend (sem id)
    const novoJogo = {
        nome: nome,
        genero: genero,
        plataforma: plataforma,
        preco: preco
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST', // Verbo HTTP para criação de recurso
            headers: {
                'Content-Type': 'application/json' // Informa ao Spring Boot que o corpo é JSON
            },
            body: JSON.stringify(novoJogo) // Converte o objeto JS em texto JSON
        });

        if (response.status === 201 || response.ok) {
            // Lê o objeto retornado pelo backend contendo o ID recém-gerado
            const jogoCriado = await response.json();

            exibirMensagem(
                `Jogo <strong>"${escaparHTML(jogoCriado.nome)}"</strong> cadastrado com sucesso! ID gerado pelo banco: <strong>#${jogoCriado.id}</strong>.`,
                'success'
            );

            // Limpa o formulário de cadastro e atualiza a listagem automaticamente
            document.getElementById('form-cadastrar').reset();
            await listarJogos();
        } else {
            throw new Error(`Erro inesperado ao cadastrar: HTTP ${response.status}`);
        }
    } catch (erro) {
        console.error('Erro no cadastro:', erro);
        exibirMensagem('Erro ao cadastrar o jogo. Verifique os dados e a conexão com o servidor.', 'danger');
    }
}

// ============================================================================
// OPERAÇÃO 3: BUSCAR JOGO POR ID (GET /jogo/{id})
// Rota: GET http://localhost:8080/jogo/{id}
// ============================================================================

/**
 * Consulta um único jogo pelo seu ID na URL usando o verbo HTTP GET.
 * Trata especificamente o status 404 Not Found caso o ID não exista no banco.
 */
async function buscarJogoPorId(event) {
    if (event) event.preventDefault();

    const id = document.getElementById('busca-id-input').value.trim();
    const containerResultado = document.getElementById('resultado-busca-id');

    if (!id) return;

    try {
        const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            }
        });

        // Tratamento específico para ID inexistente (404 Not Found)
        if (response.status === 404) {
            idDestaqueAtual = null;
            containerResultado.innerHTML = '';
            exibirMensagem(`Jogo com ID <strong>#${escaparHTML(id)}</strong> não foi encontrado.`, 'warning');
            return;
        }

        if (!response.ok) {
            throw new Error(`Erro HTTP ao buscar por ID: ${response.status}`);
        }

        // Status 200 OK: lê o objeto Jogo retornado
        const jogo = await response.json();
        idDestaqueAtual = jogo.id;

        exibirMensagem(`Jogo <strong>#${jogo.id}</strong> encontrado com sucesso!`, 'success');

        // Renderiza o jogo em destaque na tela com botões rápidos de Editar e Excluir
        containerResultado.innerHTML = `
      <div class="game-card-highlight p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="badge bg-info text-dark fw-bold">
            <i class="bi bi-star-fill me-1"></i> RESULTADO EM DESTAQUE
          </span>
          <span class="game-id-pill">ID #${jogo.id}</span>
        </div>

        <h3 class="h4 text-white fw-bold mb-3">${escaparHTML(jogo.nome)}</h3>

        <div class="row g-2 mb-4">
          <div class="col-sm-6">
            <small class="text-secondary d-block">Gênero</small>
            <span class="badge badge-genero fs-6 mt-1">${escaparHTML(jogo.genero)}</span>
          </div>
          <div class="col-sm-6">
            <small class="text-secondary d-block">Plataforma</small>
            <span class="badge badge-plataforma fs-6 mt-1">${escaparHTML(jogo.plataforma)}</span>
          </div>
        </div>

        <div class="pt-3 border-top border-secondary border-opacity-25 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <small class="text-secondary d-block">Preço</small>
            <span class="game-price">${formatarPrecoBRL(jogo.preco)}</span>
          </div>

          <div class="d-flex gap-2">
            <button
              type="button"
              class="btn btn-cyan"
              onclick='prepararEdicao(${JSON.stringify(jogo)})'
            >
              <i class="bi bi-pencil-square me-1"></i> Editar Jogo
            </button>
            <button
              type="button"
              class="btn btn-danger"
              onclick="deletarJogo(${jogo.id})"
            >
              <i class="bi bi-trash3 me-1"></i> Excluir Jogo
            </button>
          </div>
        </div>
      </div>
    `;
    } catch (erro) {
        console.error('Erro na busca por ID:', erro);
        exibirMensagem('Falha ao consultar o jogo por ID no servidor.', 'danger');
    }
}

// ============================================================================
// OPERAÇÃO 4: ATUALIZAR JOGO POR ID (PUT /jogo/{id})
// Rota: PUT http://localhost:8080/jogo/{id}
// ============================================================================

/**
 * Preenche automaticamente a aba "Atualizar Jogo" ao clicar em "Editar" em algum card
 * e ativa a aba correspondente para facilitar a edição.
 */
function prepararEdicao(jogo) {
    document.getElementById('edit-id').value = jogo.id;
    document.getElementById('edit-nome').value = jogo.nome ?? '';
    document.getElementById('edit-genero').value = jogo.genero ?? '';
    document.getElementById('edit-plataforma').value = jogo.plataforma ?? '';
    document.getElementById('edit-preco').value = jogo.preco ?? '';

    // Ativa a aba "Atualizar Jogo" usando a API do Bootstrap 5
    const tabAtualizarBtn = document.getElementById('tab-atualizar-btn');
    const tabInstance = bootstrap.Tab.getOrCreateInstance(tabAtualizarBtn);
    tabInstance.show();

    exibirMensagem(
        `Editando o jogo <strong>#${jogo.id} (${escaparHTML(jogo.nome)})</strong>. Deixe em branco qualquer campo que desejar manter inalterado.`,
        'info'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Envia os dados atualizados usando o verbo HTTP PUT.
 * REGRA IMPORTANTE: Qualquer campo deixado em branco pelo usuário deve ser enviado
 * como `null` no JSON (nunca "" ou NaN), para que o backend mantenha o valor antigo.
 */
async function atualizarJogo(event) {
    event.preventDefault();

    const id = document.getElementById('edit-id').value.trim();
    const nomeBruto = document.getElementById('edit-nome').value.trim();
    const generoBruto = document.getElementById('edit-genero').value.trim();
    const plataformaBruta = document.getElementById('edit-plataforma').value.trim();
    const precoBruto = document.getElementById('edit-preco').value.trim();

    // Converte strings vazias ou preços inválidos estritamente para null
    const precoConvertido = precoBruto === '' ? null : parseFloat(precoBruto);

    const payloadAtualizacao = {
        nome: nomeBruto === '' ? null : nomeBruto,
        genero: generoBruto === '' ? null : generoBruto,
        plataforma: plataformaBruta === '' ? null : plataformaBruta,
        preco: precoConvertido === null || isNaN(precoConvertido) ? null : precoConvertido
    };

    try {
        const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
            method: 'PUT', // Verbo HTTP para atualização de recurso existente
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadAtualizacao)
        });

        // Trata 404 Not Found caso o ID informado não exista
        if (response.status === 404) {
            exibirMensagem(`Não foi possível atualizar: Jogo com ID <strong>#${escaparHTML(id)}</strong> não encontrado.`, 'warning');
            return;
        }

        if (!response.ok) {
            throw new Error(`Erro HTTP ao atualizar: ${response.status}`);
        }

        // Status 200 OK: lê o jogo atualizado retornado pelo backend
        const jogoAtualizado = await response.json();

        exibirMensagem(
            `Jogo <strong>#${jogoAtualizado.id} (${escaparHTML(jogoAtualizado.nome)})</strong> atualizado com sucesso!`,
            'success'
        );

        document.getElementById('form-atualizar').reset();

        // Atualiza o catálogo na tela
        await listarJogos();

        // Se o jogo atualizado estiver em destaque na aba "Buscar por ID", atualiza o destaque também
        if (idDestaqueAtual === jogoAtualizado.id) {
            document.getElementById('busca-id-input').value = jogoAtualizado.id;
            await buscarJogoPorId();
        }
    } catch (erro) {
        console.error('Erro ao atualizar jogo:', erro);
        exibirMensagem('Erro ao atualizar o jogo. Verifique a conexão com o backend.', 'danger');
    }
}

// ============================================================================
// OPERAÇÃO 5: DELETAR JOGO POR ID (DELETE /jogo/{id})
// Rota: DELETE http://localhost:8080/jogo/{id}
// ============================================================================

/**
 * Remove um jogo pelo ID usando o verbo HTTP DELETE.
 * IMPORTANTE: O backend retorna status 204 No Content (corpo vazio),
 * portanto NÃO chamamos response.json() nesta operação.
 */
async function deletarJogo(id) {
    const confirmou = window.confirm(`Tem certeza que deseja excluir permanentemente o jogo ID #${id}?`);
    if (!confirmou) return;

    try {
        const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
            method: 'DELETE' // Verbo HTTP para remoção de recurso
        });

        // Status 204 No Content: exclusão bem-sucedida sem corpo de resposta
        if (response.status === 204) {
            exibirMensagem(`Jogo <strong>#${escaparHTML(id)}</strong> excluído com sucesso!`, 'success');

            // Se o jogo excluído estava em destaque na busca por ID, limpa o card
            if (Number(idDestaqueAtual) === Number(id)) {
                idDestaqueAtual = null;
                document.getElementById('resultado-busca-id').innerHTML = '';
            }

            // Atualiza o catálogo automaticamente
            await listarJogos();
            return;
        }

        // Status 404 Not Found: ID não encontrado no banco
        if (response.status === 404) {
            exibirMensagem(`Não foi possível excluir: Jogo com ID <strong>#${escaparHTML(id)}</strong> não encontrado.`, 'warning');
            return;
        }

        throw new Error(`Erro HTTP ao deletar: ${response.status}`);
    } catch (erro) {
        console.error('Erro ao deletar jogo:', erro);
        exibirMensagem('Erro ao tentar excluir o jogo no servidor.', 'danger');
    }
}

// ============================================================================
// INICIALIZAÇÃO DOS EVENTOS DA PÁGINA
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Carrega automaticamente todos os jogos assim que a página abre
    listarJogos();

    // 2. Formulário de filtros do catálogo
    document.getElementById('form-filtros').addEventListener('submit', (event) => {
        event.preventDefault();
        const filtros = {
            nome: document.getElementById('filtro-nome').value,
            genero: document.getElementById('filtro-genero').value,
            plataforma: document.getElementById('filtro-plataforma').value,
            preco: document.getElementById('filtro-preco').value
        };
        listarJogos(filtros);
    });

    // Botão para limpar filtros e recarregar lista completa (GET /jogo sem query params)
    document.getElementById('btn-limpar-filtros').addEventListener('click', () => {
        document.getElementById('form-filtros').reset();
        listarJogos();
    });

    // 3. Formulário de busca por ID
    document.getElementById('form-buscar-id').addEventListener('submit', buscarJogoPorId);

    // 4. Formulário de cadastro de jogo
    document.getElementById('form-cadastrar').addEventListener('submit', cadastrarJogo);

    // 5. Formulário de atualização por ID
    document.getElementById('form-atualizar').addEventListener('submit', atualizarJogo);

    // 6. Formulário da aba "Deletar Jogo"
    document.getElementById('form-deletar').addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = document.getElementById('delete-id-input').value.trim();
        if (!id) return;
        await deletarJogo(id);
        document.getElementById('form-deletar').reset();
    });
});