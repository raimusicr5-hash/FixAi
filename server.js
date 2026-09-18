import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Permite que o GitHub Pages converse com o servidor do Render
app.use(cors({
    origin: [
        "https://raimusicr5-hash.github.io",
        "https://fixlyra.onrender.com"
    ]
}));

app.use(express.json({ limit: "15mb" }));
app.use(express.static("."));

app.post("/api/analisar", async (req, res) => {
    try {
        const { problema, imagem, historico } = req.body;

        if (!problema && !imagem) {
            return res.status(400).json({
                erro: "Nenhum problema foi enviado."
            });
        }

        let conteudo = [];

        if (problema) {
            conteudo.push({
                text: problema
            });
        }

        if (imagem) {
            const match = imagem.match(
                /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
            );

            if (match) {
                conteudo.push({
                    inlineData: {
                        mimeType: match[1],
                        data: match[2]
                    }
                });
            }
        }

        let prompt = `
Você é o FixAI, um assistente de inteligência artificial que ajuda pessoas a identificar e resolver problemas do dia a dia.

Analise o problema informado pelo usuário e responda em português do Brasil.

Seja claro, simples e prático.

Quando possível:
1. Explique o que pode estar acontecendo.
2. Dê passos para tentar resolver.
3. Avise quando for necessário procurar um profissional.
4. Não invente informações.
5. Priorize segurança.

Problema do usuário:
${problema || "O usuário enviou uma imagem."}
`;

        if (historico && Array.isArray(historico) && historico.length > 0) {
            prompt += `

Histórico da conversa:
${JSON.stringify(historico)}
`;
        }

        conteudo.unshift({
            text: prompt
        });

        let resposta;

        for (let tentativa = 1; tentativa <= 4; tentativa++) {
            try {
                console.log(`Tentativa ${tentativa}/4`);

                resposta = await ai.models.generateContent({
                    model: "gemini-3.6-flash",
                    contents: conteudo
                });

                console.log("Resposta recebida do Gemini.");
                break;

            } catch (erro) {
                console.error(`Erro na tentativa ${tentativa}:`, erro);

                if (tentativa === 4) {
                    throw erro;
                }

                await new Promise(resolve =>
                    setTimeout(resolve, 1500)
                );
            }
        }

        return res.json({
            resposta: resposta.text
        });

    } catch (erro) {
        console.error("ERRO NA API:", erro);

        return res.status(500).json({
            erro: "Não foi possível analisar o problema.",
            detalhes: erro.message
        });
    }
});

app.get("/api/status", (req, res) => {
    res.json({
        status: "online",
        sistema: "FixAI"
    });
});

app.listen(PORT, () => {
    console.log("=================================");
    console.log("       FIXAI INICIADO");
    console.log("=================================");
    console.log(`Servidor rodando na porta ${PORT}`);
});