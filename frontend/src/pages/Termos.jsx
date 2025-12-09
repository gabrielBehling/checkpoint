import React from 'react';

import Header from "../components/Header";
import Footer from "../components/Footer";

import "../assets/css/Termos.css"; 

export default function Termos() { 

    
    const termosData = {
        titulo: "Termos de Serviço e Condições de Uso",
        data: "Última atualização: 9 de Dezembro de 2025",
        introducao: "Bem-vindo à nossa plataforma de torneios. Ao acessar e utilizar nossos serviços, você concorda em cumprir e se sujeitar aos seguintes termos e condições.",
        secoes: [
            {
                titulo: "1. Aceitação dos Termos",
                conteudo: "Ao se cadastrar ou usar a plataforma, você declara ter lido, compreendido e aceito estes Termos, que constituem um acordo legal vinculante entre você e a administração da plataforma."
            },
            {
                titulo: "2. Cadastro de usuário",
                conteudo: "Para usar os serviços será necessário que você faça um cadastro. Você concorda em manter sua senha confidencial e será responsável por todo o uso de sua conta e senha. Reservamo-nos o direito de remover ou alterar um nome de usuário que você selecionar se determinarmos, a nosso exclusivo critério, que tal nome de usuário é inadequado, obsceno ou de alguma forma questionável."
            },
            {
                titulo: "3. Regras de Conduta e Jogo Limpo",
                conteudo: "Em relação às regras dos torneios cabe restritamente e exclusivamente ao criador do evento decidir o que pode e não pode. Nós não nos responsabilizamos por quaisquer violações nas regras, trapaças ou mau comportamento que ocorrer durante o torneio."
            },
            
            {
                titulo:"4. Responsabilidade Financeira Relacionados a Torneios e Eventos",
                conteudo:"O checkpoint  atua estritamente como facilitadora e provedora de tecnologia da plataforma para o desenvolvimento e gerenciamento de eventos relacionados à área de eSports. É expressamente estabelecido que a checkpoint não assume qualquer responsabilidade legal, contratual ou financeira, direta ou indireta, por quaisquer perdas, danos, custos, taxas, ou problemas de natureza financeira que possam surgir da participação do Usuário em tais eventos. Isso abrange integralmente questões relativas a taxas de inscrição, reembolsos, distribuição e recebimento de prêmios em dinheiro, ou qualquer outra transação monetária efetuada entre o usuário e terceiros. Qualquer disputa, contestação ou problema de pagamento relacionado a um torneio ou evento deve ser resolvido integral e exclusivamente entre o usuário participante e o Organizador do Evento (ou a entidade terceira responsável pela gestão dos fundos). O Usuário reconhece e concorda que a checkpoint está isenta da obrigação de mediar, intervir, investigar ou de qualquer forma participar na resolução de tais disputas financeiras, devendo o Usuário exercer a devida diligência ao se envolver em transações monetárias com Organizadores através da plataforma."
            },
            
            {
                titulo: "5. Resolução de Disputas",
                conteudo: "Qualquer disputa ou contestação de resultado deve ser submetida por meio de um Ticket de Suporte oficial dentro do prazo estipulado nas regras do torneio. A decisão da equipe de administração do torneio sobre qualquer disputa é final e obrigatória."
            },
            {
                titulo: "6. Propriedade Intelectual",
                conteudo: "Todo o conteúdo da plataforma, incluindo logotipos, designs, textos e código-fonte, é propriedade da nossa equipe e está protegido por leis de direitos autorais. O uso não autorizado é proibido."
            },
            
            {
                titulo: "7. Anunciantes",
                conteudo: "Permitimos que anunciantes exibam seus anúncios em áreas específicas do site. Apenas fornecemos os espaços para esses anúncios e não temos qualquer outro tipo de relação com os anunciantes. "
            },
            {
                titulo: "8. Correções",
                conteudo: "Pode haver informações nos serviços que contenham erros, omissões ou imprecisões. Temos o direito de corrigir quaisquer erros, omissões ou imprecisões e de alterar ou atualizar qualquer uma das informações a qualquer momento sem aviso prévio."
            },
            {
                titulo:"9. Erros de Funcionamento e Bugs",
                conteudo: "Não garantimos o funcionamento perfeito do sistema, podendo incluir erros ou problemas de funcionamento durante o uso do site, mas o usuário tem todo o direito de reportar os erros na seção de 'Ajuda' localizado na parte inferior do site."      
            },

            {
                titulo: "10. Mau Uso",
                conteudo:"EM NENHUMA HIPÓTESE NÓS OU NOSSOS DIRETORES, FUNCIONÁRIOS OU AGENTES SEREMOS RESPONSÁVEIS PERANTE VOCÊ OU QUALQUER TERCEIRO POR QUAISQUER DANOS DIRETOS, INDIRETOS, CONSEQUENCIAIS, EXEMPLARES, INCIDENTAIS, ESPECIAIS OU PUNITIVOS, INCLUINDO PERDA DE DADOS OU OUTROS DANOS DECORRENTES DO SEU USO DOS SERVIÇOS, MESMO QUE TENHAMOS SIDO AVISADOS DA POSSIBILIDADE DE TAIS DANOS. "
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