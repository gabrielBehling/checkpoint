import React from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Importe o hook 'useNavigate'
import LOGO_IMG from "../assets/img/imagem.png";

// 2. Importe seus arquivos CSS
// (Assumindo que eles estão na raiz do 'src' ou ajustados)

import '../assets/css/404page.css';

function NotFoundPage() {
    // 3. Inicialize o hook
    const navigate = useNavigate();

    /**
     * Esta função é chamada pelo link.
     * 'navigate(-1)' diz ao React Router para "voltar uma página" 
     * no histórico de navegação.
     */
    const handleGoBack = (e) => {
        e.preventDefault(); // Impede o link de recarregar a página
        navigate(-1);       // 4. Navega para a página anterior
    };

    return (
        <div className="error-container">
            
            {/* Reutilizando sua classe de logo existente */}
                {/* Logo + Título lado a lado */}
                <div className="logo-title">
                    <img 
                        src={LOGO_IMG} 
                        alt="Logo Checkpoint" 
                        className="logo-img"
                    />
                    <h1>CHECKPOINT</h1>
                </div>


            {/* O código de erro gigante */}
            <div className="error-code">404</div>
            
            {/* Seu CSS .form-auth h1 já estiliza este título
            */}
            <h1>Página Não Encontrada</h1>

            {/* Mensagem de ajuda */}
            <p className="error-message">
                Desculpe, o recurso que você está tentando acessar não existe ou foi movido.
            </p>

            {/* 5. O link agora chama a função handleGoBack
            */}
            <div className="error-link">
                <a href="#" onClick={handleGoBack}>
                    Voltar para a Página Anterior
                </a>
            </div>

        </div>
    );
}

export default NotFoundPage;