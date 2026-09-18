// =====================================
// FIXAI
// CHAT COM IA
// =====================================

// =====================================
// ELEMENTOS
// =====================================

const problem = document.getElementById("problem");
const result = document.getElementById("result");
const attachmentArea = document.getElementById("attachmentArea");
const micButton = document.getElementById("micButton");

// =====================================
// VARIÁVEIS
// =====================================

let imagemBase64 = null;
let conversa = [];

// =====================================
// NAVEGAÇÃO
// =====================================

const navButtons = document.querySelectorAll(".nav-item");

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        abrirPagina(button.dataset.page);
    });
});

function abrirPagina(page) {

    document.querySelectorAll(".page").forEach(p => {
        p.classList.remove("active-page");
    });

    navButtons.forEach(button => {
        button.classList.remove("active");
    });

    const pagina = document.getElementById(page + "Page");

    if (pagina) {
        pagina.classList.add("active-page");
    }

    const botao = document.querySelector(
        `[data-page="${page}"]`
    );

    if (botao) {
        botao.classList.add("active");
    }
}

// =====================================
// NOVO DIAGNÓSTICO
// =====================================

document
    .getElementById("newDiagnosis")
    .addEventListener("click", () => {

        abrirPagina("home");

        problem.value = "";

        result.innerHTML = "";

        result.classList.remove("show");

        attachmentArea.innerHTML = "";

        imagemBase64 = null;

        conversa = [];

        problem.focus();
    });

// =====================================
// CATEGORIAS
// =====================================

document
    .querySelectorAll(".category")
    .forEach(category => {

        category.addEventListener("click", () => {

            const nome = category.dataset.category;

            problem.value =
                `Quero diagnosticar um equipamento da categoria ${nome}.`;

            problem.focus();
        });
    });

// =====================================
// ENVIAR MENSAGEM
// =====================================

document
    .getElementById("analyzeButton")
    .addEventListener("click", analisarProblema);

async function analisarProblema() {

    const texto = problem.value.trim();

    if (!texto && !imagemBase64) {
        return;
    }

    // =================================
    // GUARDAR MENSAGEM DO USUÁRIO
    // =================================

    if (texto) {

        conversa.push({
            role: "user",
            text: texto
        });

    }

    problem.value = "";

    // =================================
    // MOSTRAR MENSAGEM
    // =================================

    adicionarMensagem(
        "user",
        texto
    );

    // =================================
    // LOADING
    // =================================

    adicionarLoading();

    try {

        // =================================
        // BACKEND ONLINE DO FIXAI
        // =================================

        const response = await fetch(
            "https://fixlyra.onrender.com/api/analisar",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    problema: texto,
                    imagem: imagemBase64,
                    historico: conversa
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.erro ||
                "Erro desconhecido no servidor."
            );

        }

        removerLoading();

        // =================================
        // GUARDAR RESPOSTA
        // =================================

        conversa.push({
            role: "assistant",
            text: data.resposta
        });

        // =================================
        // MOSTRAR RESPOSTA
        // =================================

        adicionarMensagem(
            "assistant",
            data.resposta
        );

        salvarReparo(texto);

        // =================================
        // LIMPAR IMAGEM
        // =================================

        imagemBase64 = null;

        attachmentArea.innerHTML = "";

    } catch (error) {

        console.error(
            "ERRO NO FIXAI:",
            error
        );

        removerLoading();

        adicionarMensagem(
            "assistant",
            "❌ Não foi possível realizar a análise.\n\n" +
            error.message
        );
    }
}

// =====================================
// MOSTRAR MENSAGEM
// =====================================

function adicionarMensagem(tipo, texto) {

    const mensagem =
        document.createElement("div");

    mensagem.className =
        `chat-message ${tipo}`;

    mensagem.innerHTML = `

        <div class="chat-avatar">

            ${
                tipo === "user"
                    ? "👤"
                    : "🤖"
            }

        </div>

        <div class="chat-bubble">

            ${formatarResposta(texto)}

        </div>
    `;

    result.appendChild(mensagem);

    result.classList.add("show");

    mensagem.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

// =====================================
// LOADING
// =====================================

function adicionarLoading() {

    const loading =
        document.createElement("div");

    loading.id = "chatLoading";

    loading.className =
        "chat-message assistant";

    loading.innerHTML = `

        <div class="chat-avatar">
            🤖
        </div>

        <div class="chat-bubble">

            <div class="ai-loading">

                <div class="spinner"></div>

                <p>
                    O FixAI está pensando...
                </p>

            </div>

        </div>
    `;

    result.appendChild(loading);

    result.classList.add("show");

    loading.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

// =====================================
// REMOVER LOADING
// =====================================

function removerLoading() {

    const loading =
        document.getElementById("chatLoading");

    if (loading) {
        loading.remove();
    }
}

// =====================================
// FORMATAR RESPOSTA
// =====================================

function formatarResposta(texto) {

    let html = escaparHTML(texto);

    html = html.replace(
        /🔍 DIAGNÓSTICO PROVÁVEL/g,
        "<h3>🔍 DIAGNÓSTICO PROVÁVEL</h3>"
    );

    html = html.replace(
        /⚠️ POSSÍVEIS CAUSAS/g,
        "<h3>⚠️ POSSÍVEIS CAUSAS</h3>"
    );

    html = html.replace(
        /🧪 TESTES/g,
        "<h3>🧪 TESTES</h3>"
    );

    html = html.replace(
        /🔧 FERRAMENTAS/g,
        "<h3>🔧 FERRAMENTAS</h3>"
    );

    html = html.replace(
        /🛠️ PASSO A PASSO/g,
        "<h3>🛠️ PASSO A PASSO</h3>"
    );

    html = html.replace(
        /⚠️ SEGURANÇA/g,
        "<h3>⚠️ SEGURANÇA</h3>"
    );

    html = html.replace(
        /❓ PRÓXIMA PERGUNTA/g,
        "<h3>❓ PRÓXIMA PERGUNTA</h3>"
    );

    html = html.replace(
        /\n/g,
        "<br>"
    );

    return html;
}

// =====================================
// FOTO
// =====================================

const photoInput =
    document.getElementById("photoInput");

document
    .getElementById("photoButton")
    .addEventListener("click", () => {

        photoInput.click();

    });

photoInput.addEventListener(
    "change",
    async () => {

        const file =
            photoInput.files[0];

        if (!file) return;

        imagemBase64 =
            await arquivoParaBase64(file);

        mostrarArquivo(
            file,
            true
        );
    }
);

// =====================================
// VÍDEO
// =====================================

const videoInput =
    document.getElementById("videoInput");

document
    .getElementById("videoButton")
    .addEventListener("click", () => {

        videoInput.click();

    });

videoInput.addEventListener(
    "change",
    () => {

        const file =
            videoInput.files[0];

        if (!file) return;

        mostrarArquivo(
            file,
            false
        );
    }
);

// =====================================
// ARQUIVO
// =====================================

const fileInput =
    document.getElementById("fileInput");

document
    .getElementById("fileButton")
    .addEventListener("click", () => {

        fileInput.click();

    });

fileInput.addEventListener(
    "change",
    () => {

        const file =
            fileInput.files[0];

        if (!file) return;

        mostrarArquivo(
            file,
            false
        );
    }
);

// =====================================
// CONVERTER ARQUIVO
// =====================================

function arquivoParaBase64(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload = () => {

                resolve(
                    reader.result
                );

            };

            reader.onerror =
                reject;

            reader.readAsDataURL(file);
        }
    );
}

// =====================================
// MOSTRAR ARQUIVO
// =====================================

function mostrarArquivo(file, imagem) {

    attachmentArea.innerHTML = "";

    const container =
        document.createElement("div");

    container.className =
        "attachment";

    if (imagem) {

        const img =
            document.createElement("img");

        img.src =
            URL.createObjectURL(file);

        container.appendChild(img);

    } else {

        const icon =
            document.createElement("span");

        icon.textContent = "📎";

        icon.style.fontSize = "25px";

        container.appendChild(icon);
    }

    const info =
        document.createElement("div");

    info.innerHTML = `

        <strong>
            ${escaparHTML(file.name)}
        </strong>

        <br>

        <small>
            ${(file.size / 1024 / 1024).toFixed(2)}
            MB
        </small>
    `;

    container.appendChild(info);

    attachmentArea.appendChild(container);
}

// =====================================
// MICROFONE
// =====================================

let recognition = null;
let ouvindo = false;

function iniciarVoz() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        alert(
            "Seu navegador não possui reconhecimento de voz."
        );

        return;
    }

    if (ouvindo) {

        recognition.stop();

        return;
    }

    recognition =
        new SpeechRecognition();

    recognition.lang =
        "pt-BR";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;

    recognition.onstart = () => {

        ouvindo = true;

        micButton.textContent =
            "🔴";

        micButton.title =
            "Ouvindo...";
    };

    recognition.onresult =
        event => {

            const texto =
                event.results[0][0]
                    .transcript
                    .trim();

            if (!texto) return;

            problem.value =
                texto;

            analisarProblema();
        };

    recognition.onend = () => {

        ouvindo = false;

        micButton.textContent =
            "🎙️";

        micButton.title =
            "Falar";
    };

    recognition.onerror =
        () => {

            ouvindo = false;

            micButton.textContent =
                "🎙️";

            micButton.title =
                "Falar";
        };

    recognition.start();
}

micButton.addEventListener(
    "click",
    iniciarVoz
);

// =====================================
// PERFIL
// =====================================

const profileModal =
    document.getElementById("profileModal");

document
    .getElementById("profileButton")
    .addEventListener("click", () => {

        profileModal.classList.add("show");

    });

document
    .getElementById("closeProfile")
    .addEventListener("click", () => {

        profileModal.classList.remove("show");

    });

profileModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            profileModal
        ) {

            profileModal.classList.remove(
                "show"
            );
        }
    }
);

// =====================================
// HISTÓRICO
// =====================================

function salvarReparo(texto) {

    if (!texto) return;

    let reparos =
        JSON.parse(
            localStorage.getItem(
                "fixai_reparos"
            )
        ) || [];

    reparos.unshift({

        problema: texto,

        data:
            new Date()
                .toLocaleString(
                    "pt-BR"
                )
    });

    reparos =
        reparos.slice(
            0,
            30
        );

    localStorage.setItem(
        "fixai_reparos",
        JSON.stringify(reparos)
    );

    carregarHistorico();
}

// =====================================
// CARREGAR HISTÓRICO
// =====================================

function carregarHistorico() {

    const area =
        document.getElementById(
            "repairHistory"
        );

    let reparos =
        JSON.parse(
            localStorage.getItem(
                "fixai_reparos"
            )
        ) || [];

    if (reparos.length === 0) {

        area.innerHTML = `

            <div
                class="result"
                style="display:block;"
            >

                🕘 Você ainda não possui
                reparos salvos.

            </div>
        `;

        return;
    }

    area.innerHTML = "";

    reparos.forEach(
        reparo => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "result";

            div.style.display =
                "block";

            div.style.marginBottom =
                "12px";

            div.innerHTML = `

                <strong>
                    🔧
                    ${escaparHTML(
                        reparo.problema
                    )}
                </strong>

                <br>

                <small>
                    ${reparo.data}
                </small>
            `;

            area.appendChild(div);
        }
    );
}

carregarHistorico();

// =====================================
// ESCAPAR HTML
// =====================================

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        texto;

    return div.innerHTML;
}