import React from 'react';
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../assets/css/Ajuda.css"; 


export default function Ajuda() { 

    
    const faqData = [
        {
            pergunta: "Como faço para me inscrever em um torneio?",
            resposta: "Para se inscrever, navegue até a seção 'Torneios Ativos' no menu principal, clique no torneio desejado e utilize o botão 'Inscrever-se'. Você deve estar logado e ter seu game ID registrado no seu perfil."
        },
        {
            pergunta: "Como faço para acessar o chat do torneio?",
            resposta: "O chat é específico para cada evento! Para acessá-lo, vá para a página do torneio em que você está inscrito. O chat estará visível e ativo na barra lateral ou na seção de 'Comunidade' daquela página."
        },
        {
            pergunta: "As recompensas são pagas imediatamente após o torneio?",
            resposta: "As premiações (cash prizes e itens) são processadas em até 72 horas após a conclusão oficial do torneio, verificação de resultados e confirmação de elegibilidade de todos os vencedores."
        },
        {
            pergunta: "Quais são as regras de conduta para participar?",
            resposta: "Valorizamos o jogo limpo e o respeito. Todas as regras de conduta estão detalhadas em nossa página de 'Termos e Condições'. Comportamento tóxico, uso de hacks ou trapaças resultará em desclassificação e banimento."
        },
        {
            pergunta: "Onde encontro os horários e chaves dos jogos?",
            resposta: "As chaves e horários (brackets) são disponibilizados na página específica do torneio, geralmente 30 minutos antes do início. Você também receberá uma notificação por email/Discord (se configurado)."
        },
        {
            pergunta: "Como reportar um problema ou resultado incorreto?",
            resposta: "Você deve clicar no botão 'Contato' na parte e baixo de qualquer pagina do site, dentro da janela de 15 minutos após o ocorrido/fim do jogo. Inclua screenshots ou vídeos como prova, se possível."
        },
        {
            pergunta: "Existe algum custo para participar dos torneios?",
            resposta: "Depende do torneio. Alguns são gratuitos (Free-to-Play), e outros podem ter uma taxa de inscrição. Esta informação está claramente indicada na página de detalhes de cada evento."
        }
    ];

   return (
        <>
            <Header />

            <main className="ajuda-container ">
                
                <div className="ajuda-intro">
                    <h1>❓ Central de Ajuda e FAQ</h1>
                    <p>
                        Encontre rapidamente respostas para as dúvidas mais comuns sobre inscrição, regras, resultados e suporte técnico em nossos torneios.
                    </p>
                </div>
                
                <hr />

                <section className="ajuda-faq">
                    <h2>📚 Perguntas Frequentes (FAQ)</h2>
                    
                    {faqData.map((item, index) => (
                        <div key={index} className="faq-item">
                            <h3 className="faq-pergunta">{item.pergunta}</h3>
                            <p className="faq-resposta">{item.resposta}</p>
                        </div>
                    ))}
                </section>

                <hr />

                <section className="ajuda-contato">
                    <h2>Precisa de Ajuda Extra?</h2>
                    <p>
                        Para suporte direto ou questões técnicas avançadas, entre em contato com o desenvolvedor responsável:
                    </p>
                   
                    <a 
                        href="https://github.com/gabrielBehling" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="botao-contato-ajuda botao-github" 
                    >
                        Falar com o Desenvolvedor Gabriel Behling  (@gabrielBehling )
                    </a>
                </section>
            </main>

            <Footer />
        </>
    );
};