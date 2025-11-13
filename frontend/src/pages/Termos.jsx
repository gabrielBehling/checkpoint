import React from 'react';

import Header from "../components/Header";
import Footer from "../components/Footer";

import "../assets/css/Termos.css"; 

export default function Termos() { 

    
    const termosData = {
        titulo: "Termos de Serviço e Condições de Uso",
        data: "Última atualização: 13 de Novembro de 2025",
        introducao: "Bem-vindo à nossa plataforma de torneios. Ao acessar e utilizar nossos serviços, você concorda em cumprir e se sujeitar aos seguintes termos e condições.",
        secoes: [
            {
                titulo: "1. Aceitação dos Termos",
                conteudo: "Ao se cadastrar ou usar a plataforma, você declara ter lido, compreendido e aceito estes Termos, que constituem um acordo legal vinculante entre você e a administração da plataforma."
            },
            {
                titulo: "2. Cadastro e Contas de Usuário",
                conteudo: "Você deve fornecer informações precisas e completas durante o processo de registro. Você é o único responsável pela segurança de sua senha e por todas as atividades que ocorrem em sua conta. A conta é pessoal e intransferível."
            },
            {
                titulo: "3. Regras de Conduta e Jogo Limpo",
                conteudo: "É estritamente proibido o uso de qualquer forma de trapaça, hack, script ou software de terceiros que ofereça vantagem injusta em torneios. Comportamento tóxico, discurso de ódio e assédio a outros usuários resultarão em desqualificação imediata e banimento permanente da plataforma."
            },
            {
                titulo: "4. Propriedade Intelectual",
                conteudo: "Todo o conteúdo da plataforma, incluindo logotipos, designs, textos e código-fonte, é propriedade da nossa equipe e está protegido por leis de direitos autorais. O uso não autorizado é proibido."
            },
            {
                titulo: "5. Resolução de Disputas",
                conteudo: "Qualquer disputa ou contestação de resultado deve ser submetida por meio de um Ticket de Suporte oficial dentro do prazo estipulado nas regras do torneio. A decisão da equipe de administração do torneio sobre qualquer disputa é final e obrigatória."
            },
            {
                titulo: "6. Anunciantes",
                conteudo: "Permitimos que anuciantes exibam seus anúcios em áreas especificas do site. Apenas fornecemos os espaços para esses anúncios e não temos qualquer outro tipo de relação com os anunciantes. "
            },
            {
                titulo: "7. Correções",
                conteudo: "Pode haver informações nos serviços que contennham erros, omissões ou imprecisões. Temos o direito de corrigir quaisquer erros, ommissões ou imprecisôes e de alterar ou atualizar qualquer uma das informações a qualquer sem aviso prévio."
            },
            {
                titulo: "8. ",
                conteudo: ""
            }
        ]
    };

    return (
        <>
            <Header />

            <main className="termos-container">
             
                <div className="termos-intro">
                    <h1>{termosData.titulo}</h1>
                    <p className="data-atualizacao">{termosData.data}</p>
                    <p className="introducao">{termosData.introducao}</p>
                </div>
                <hr />

                <section className="termos-secoes">
                    {termosData.secoes.map((secao, index) => (
                        <div key={index} className="termo-item">
                            <h2>{secao.titulo}</h2>
                            <p>{secao.conteudo}</p>
                        </div>
                    ))}
                </section>
            </main>

            <Footer />
        </>
    );
}