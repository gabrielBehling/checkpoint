import React from 'react';
import "../assets/css/Ajuda.css";

const Ajuda = () => {

    const faqData = [
        {
            pergunta: "Como faço para me inscrever em um torneio?",
            resposta: "Para se inscrever, navegue até a seção 'Torneios Ativos' no menu principal, clique no torneio desejado e utilize o botão 'Inscrever-se'. Você deve estar logado e ter seu game ID registrado no seu perfil."
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
            resposta: "Você deve abrir um 'Ticket de Suporte' na página do torneio, dentro da janela de 15 minutos após o ocorrido/fim do jogo. Inclua screenshots ou vídeos como prova, se possível."
        },
        {
            pergunta: "Existe algum custo para participar dos torneios?",
            resposta: "Depende do torneio. Alguns são gratuitos (Free-to-Play), e outros podem ter uma taxa de inscrição. Esta informação está claramente indicada na página de detalhes de cada evento."
        }
    ];

    return (
        <div className="ajuda-container contato-container">
            <header className="ajuda-header contato-header">
                <h1> Central de Ajuda e FAQ</h1>
                <p>
                    Encontre rapidamente respostas para as dúvidas mais comuns sobre inscrição, regras, resultados e suporte técnico em nossos torneios.
                </p>
            </header>
            
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
                    Se você não encontrou a resposta que procurava, por favor, entre em contato com nossa equipe de desenvolvimento no GitHub:
                </p>
                 <a 
                    href="" // Link 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="botao-contato-ajuda botao-github" 
                >
                    Abrir um Chamado no GitHub
                </a>
            </section>
            
            <footer className="ajuda-footer contato-footer">
                <p>Estamos aqui para garantir que você tenha a melhor experiência em torneios!</p>
            </footer>
        </div>
    );
};

export default Ajuda;

