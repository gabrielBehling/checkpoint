import React from 'react';

// Os imports de Header, Footer e CSS foram removidos.

function AboutUsPage() {
  return (
    // 1. Removido o 'div' externo com className.
    //    Usamos um Fragment (<>) para agrupar os elementos 
    //    sem adicionar um nó extra ao DOM.
    <>
      {/* 2. O Header foi removido. */}
      
      {/* 3. A estrutura do <main> foi mantida pela semântica,
             mas as classes foram removidas. */}
      <main>
        
        {/* 4. O 'div' interno com className foi removido. */}
        
        <h1>Sobre o Checkpoint</h1>

        {/* 5. A classe 'mission-statement' foi removida. */}
        <p>
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

      </main>

      {/* 6. O Footer foi removido. */}
    </>
  );
}

export default AboutUsPage;