const novoDiagnosticoBtn = document.getElementById("novoDiagnosticoBtn");
const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

const chatResult = document.getElementById("chatResult");
const problemaInput = document.getElementById("problemaInput");
const enviarBtn = document.getElementById("enviarBtn");
const micBtn = document.getElementById("micBtn");
const tirarFotoBtn = document.getElementById("tirarFotoBtn");
const enviarArquivoBtn = document.getElementById("enviarArquivoBtn");
const fileInput = document.getElementById("fileInput");
const attachmentArea = document.getElementById("attachmentArea");

let imagemBase64 = null;
let historicoConversa = [];

// Navegação entre páginas
navItems.forEach(item => {
    item.addEventListener("click", () => {
        const targetPage = item.getAttribute("data-page");

        navItems.forEach(nav => nav.classList.remove("active"));
        item.classList.add("active");

        pages.forEach(page => {
            if (page.id === targetPage) {
                page.classList.add("active-page");
            } else {
                page.classList.remove("active-page");
            }
        });
    });
});

novoDiagnosticoBtn.addEventListener("click", () => {
    chatResult.innerHTML = "";
    historicoConversa = [];
    problemaInput.value = "";
    removerAnexo();
    
    navItems.forEach(nav => nav.classList.remove("active"));
    document.querySelector('[data-page="inicio"]').classList.add("active");
    pages.forEach(page => page.classList.remove("active-page"));
    document.getElementById("inicio").classList.add("active-page");
});

// Envio de arquivo / foto
enviarArquivoBtn.addEventListener("click", () => fileInput.click());
tirarFotoBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(uploadEvent) {
        imagemBase64 = uploadEvent.target.result;
        
        attachmentArea.style.display = "block";
        attachmentArea.innerHTML = `
            <div class="attachment">
                <img src="${imagemBase64}" alt="Anexo">
                <span>Imagem anexada com sucesso!</span>
                <button onclick="removerAnexo()" style="background:none; border:none; color:red; cursor:pointer; margin-left:auto;">✕</button>
            </div>
        `;
    };
    reader.readAsDataURL(file);
});

window.removerAnexo = function() {
    imagemBase64 = null;
    fileInput.value = "";
    attachmentArea.style.display = "none";
    attachmentArea.innerHTML = "";
};

// Enviar mensagem para a IA
async function enviarMensagem() {
    const texto = problemaInput.value.trim();

    if (!texto && !imagemBase64) return;

    // Adiciona mensagem do usuário na tela
    adicionarMensagemNaTela(texto, "user", imagemBase64);

    const mensagemAtual = texto;
    const imagemAtual = imagemBase64;

    // Limpa campos
    problemaInput.value = "";
    removerAnexo();

    // Mostra indicador de carregamento
    const loadingId = mostrarCarregamento();

    try {
        const resposta = await fetch("/api/analisar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                problema: mensagemAtual,
                imagem: imagemAtual,
                historico: historicoConversa
            })
        });

        const dados = await resposta.json();

        removerCarregamento(loadingId);

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao se comunicar com o servidor.");
        }

        adicionarMensagemNaTela(dados.resposta, "assistant");

        // Salva no histórico
        historicoConversa.push({ role: "user", text: mensagemAtual || "[Imagem enviada]" });
        historicoConversa.push({ role: "assistant", text: dados.resposta });

    } catch (error) {
        removerCarregamento(loadingId);
        adicionarMensagemNaTela("Erro: " + error.message, "assistant");
    }
}

enviarBtn.addEventListener("click", enviarMensagem);

problemaInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
    }
});

function adicionarMensagemNaTela(texto, remetente, imagem = null) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message ${remetente}`;

    let conteudoImagem = imagem ? `<img src="${imagem}" style="max-width:100%; border-radius:8px; margin-bottom:8px;" />` : "";
    let textoFormatado = texto ? texto.replace(/\n/g, "<br>") : "";

    msgDiv.innerHTML = `
        ${remetente === 'assistant' ? '<div class="chat-avatar">🤖</div>' : ''}
        <div class="chat-bubble">
            ${conteudoImagem}
            ${textoFormatado}
        </div>
        ${remetente === 'user' ? '<div class="chat-avatar" style="background:#6957d9;">👤</div>' : ''}
    `;

    chatResult.appendChild(msgDiv);
    chatResult.scrollTop = chatResult.scrollHeight;
}

function mostrarCarregamento() {
    const id = "loading-" + Date.now();
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-message assistant";
    msgDiv.id = id;

    msgDiv.innerHTML = `
        <div class="chat-avatar">🤖</div>
        <div class="chat-bubble">
            <div class="ai-loading">
                <div class="spinner"></div>
                <p>Analisando...</p>
            </div>
        </div>
    `;

    chatResult.appendChild(msgDiv);
    chatResult.scrollTop = chatResult.scrollHeight;
    return id;
}

function removerCarregamento(id) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.remove();
}

// Reconhecimento de voz (Microfone)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'pt-BR';
    recognition.interimResults = false;

    micBtn.addEventListener("click", () => {
        recognition.start();
        micBtn.style.background = "#6957d9";
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        problemaInput.value += (problemaInput.value ? " " : "") + transcript;
        micBtn.style.background = "";
    };

    recognition.onerror = () => {
        micBtn.style.background = "";
    };

    recognition.onend = () => {
        micBtn.style.background = "";
    };
} else {
    micBtn.style.display = "none";
}
