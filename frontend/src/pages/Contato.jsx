import React from 'react';
import "../assets/css/Contatos.css";

const Contato = () => {

    const membrosDoTime = [
        { nome: "Adryel Arlindo", githubUser: "Adryel115", url: "https://github.com/Adryel115" },
        { nome: "Gabriel Behling", githubUser: "gabrielBehling", url: "https://github.com/gabrielBehling" },
        { nome: "Lucas Rodrigues", githubUser: "lucas14BRzx", url: "https://github.com/lucas14BRzx" },
        { nome: "Mateus Rodrigues", githubUser: "MLino5", url: "https://github.com/MLino5" },
        { nome: "Vinicius Gabriel", githubUser: "Vinicius-Gabriel14", url: "https://github.com/Vinicius-Gabriel14" },
    ];

    return (
        <div className="contato-container">
            <header className="contato-header">
                <h1> Conecte-se com a Equipe no GitHub</h1>
                <p>
                    Nosso projeto é feito pela comunidade! Conheça os desenvolvedores e entre em contato individualmente
                    para falar sobre o projeto ou contribuir diretamente.
                </p>
            </header>
            
            <hr />

            <section className="contato-github">
                <h2>👤 Os 5 Membros da Equipe</h2>
                <p>
                    Para entrar em contato, abra um novo *Issue* ou mencione o membro apropriado em nosso repositório principal.
                </p>
                
               
                <div className="membros-grid">
                    {membrosDoTime.map((membro, index) => (
                        <a 
                            key={index}
                            href={membro.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="membro-card"
                        >
                          
                            
                            <strong className="membro-nome">{membro.nome}</strong>
                            <span className="membro-user">@{membro.githubUser}</span>
                        </a>
                    ))}
                </div>
            </section>

            <footer className="contato-footer">
                <p>Acompanhe o desenvolvimento e junte-se à nossa comunidade!</p>
            </footer>
        </div>
    );
};

export default Contato;
