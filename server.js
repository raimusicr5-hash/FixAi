import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json({ limit: "15mb" }));
app.use(express.static("."));

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function gerarRespostaGemini(config) {

    const tentativas = 4;

    for (
        let tentativa = 1;
        tentativa <= tentativas;
        tentativa++
    ) {

        try {

            console.log(
                "Tentativa " +
                tentativa +
                "/" +
                tentativas
            );

            const response =
                await ai.models.generateContent(config);

            console.log(
                "Resposta recebida do Gemini."
            );

            return response;

        } catch (error) {

            console.error(
                "Erro na tentativa " +
                tentativa +
                ":",
                error.message || error
            );

            const status =
                error?.status ||
                error?.error?.code;

            if (
                status === 503 &&
                tentativa < tentativas
            ) {

                const espera =
                    tentativa * 2000;

                console.log(
                    "Gemini ocupado. Nova tentativa em " +
                    (espera / 1000) +
                    " segundos..."
                );

                await esperar(espera);

                continue;
            }

            throw error;
        }
    }
}

app.post(
    "/api/analisar",
    async (req, res) => {

        try {

            const {
                problema,
                imagem,
                historico
            } = req.body;

            if (
                !problema &&
                !imagem
            ) {

                return res.status(400).json({
                    erro:
                        "Digite uma mensagem ou envie uma imagem."
                });
            }

            const instrucoes = `
Você é o Fixlyra, um assistente inteligente especializado em diagnóstico, manutenção, reparo e solução de problemas.

Você conversa com o usuário de forma natural, como um assistente de conversa contínua.

Responda sempre em português do Brasil.

Mantenha o contexto da conversa.

Considere as mensagens anteriores.

Não repita perguntas que já foram respondidas.

Se o usuário fizer uma pergunta comum, responda normalmente.

Se estiver tentando consertar alguma coisa, ajude passo a passo.

Faça perguntas quando faltar alguma informação.

Não invente informações.

Quando houver risco elétrico, mecânico, químico ou outro risco físico, avise o usuário.

Seja claro e direto.

Não fale em voz alta.

Responda somente por texto.

O usuário pode continuar enviando mensagens sobre o mesmo assunto.
`;

            const partes = [];

            partes.push({
                text: instrucoes
            });

            if (
                Array.isArray(historico) &&
                historico.length > 0
            ) {

                const historicoTexto =
                    historico
                        .map(mensagem => {

                            const nome =
                                mensagem.role === "user"
                                    ? "Usuário"
                                    : "Fixlyra";

                            return (
                                nome +
                                ": " +
                                mensagem.text
                            );

                        })
                        .join("\n\n");

                partes.push({
                    text:
                        "\n\nHISTÓRICO DA CONVERSA:\n\n" +
                        historicoTexto
                });
            }

            partes.push({
                text:
                    "\n\nMENSAGEM ATUAL DO USUÁRIO:\n" +
                    (
                        problema ||
                        "O usuário enviou uma imagem."
                    )
            });

            if (imagem) {

                const match =
                    imagem.match(
                        /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
                    );

                if (match) {

                    partes.push({
                        inlineData: {
                            mimeType: match[1],
                            data: match[2]
                        }
                    });
                }
            }

            const response =
                await gerarRespostaGemini({

                    model: "gemini-3.6-flash",

                    contents: [
                        {
                            role: "user",
                            parts: partes
                        }
                    ]

                });

            const resposta =
                response.text;

            if (!resposta) {

                throw new Error(
                    "O Gemini não retornou uma resposta."
                );
            }

            res.json({
                resposta: resposta
            });

        } catch (error) {

            console.error("");
            console.error(
                "================================="
            );
            console.error(
                "ERRO FINAL DO FIXLYRA:"
            );
            console.error(error);
            console.error(
                "================================="
            );
            console.error("");

            const status =
                error?.status;

            if (status === 503) {

                return res.status(503).json({

                    erro:
                        "A inteligência artificial está temporariamente ocupada. Tente novamente em alguns segundos."

                });
            }

            return res.status(500).json({

                erro:
                    "Erro ao conversar com a inteligência artificial."

            });
        }
    }
);

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "================================="
        );
        console.log(
            "       FIXLYRA INICIADO"
        );
        console.log(
            "================================="
        );
        console.log("");
        console.log(
            "Abra no navegador: http://localhost:" +
            PORT
        );
        console.log("");

    }
);
