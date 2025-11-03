import React from 'react';

// 1. Componentes reutilizáveis
import Header from '../components/Header'; // Ajuste o caminho se necessário
import Footer from '../components/Footer'; // Ajuste o caminho se necessário

// 2. Importado APENAS o CSS desta página
import '../assets/css/AboutUsStyle.css'; 
// (A importação do 'CadastroStyle.css' foi removida)

function AboutUsPage() {
  return (
    // 3. Adicionado um "wrapper" para controlar o fundo e layout da página
    <div className="about-us-page-wrapper">
      
      {/* Seu Header reutilizado */}
      <Header />

      {/* A classe 'container' agora será definida 
        diretamente no 'AboutUsStyle.css' 
      */}
      <main className="container">
        
        {/* 'about-us-content' é a classe com os estilos desta página */}
        <div className="about-us-content">
          
          <h1>Sobre o Checkpoint</h1>

          <p className="mission-statement">
            O Checkpoint nasceu de um projeto de conclusão de curso com uma missão clara: 
            <strong> simplificar o universo dos eSports.</strong>
          </p>
          
          <p>
            Somos um site focado no gerenciamento de torneios, criado para trazer 
            praticidade e facilidade tanto para <strong>organizadores</strong> quanto 
            para <strong>jogadores</strong>.
          </p>
          
          <p>
            Mais do que apenas uma ferramenta, buscamos ativamente incentivar e 
            fomentar o cenário competitivo, ajudando a comunidade a crescer 
            e se profissionalizar.
          </p>

        </div>
      </main>

      {/* Seu Footer reutilizado */}
      <Footer />
    </div>
  );
}

export default AboutUsPage;