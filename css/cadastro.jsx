import { React, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./login.css"; // Assumindo que este CSS agora contém os estilos fornecidos
import api from "./api"
import axios from "axios";

export default function CadastroPage() { // Mudei o nome para CadastroPage, pois a estrutura é de cadastro
    const navigate = useNavigate();
    
    // Estados adaptados para os campos do formulário de CADASTRO
    const [nome, setNome] = useState("");
     const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [type, setType] = useState("Player"); // Estado para o rádio button

    function handleEmailChange(e) {
        setEmail(e.target.value);
    }

    function handleNameChange(e) {
    setNome(e.target.value);
  }
    
    function handlePasswordChange(e) {
        setPassword(e.target.value);
    }

    function handlePasswordConfirmChange(e) {
        setPasswordConfirm(e.target.value);
    }

    function handleTypeChange(e) {
        setType(e.target.value);
    }

    function handleSubmit(e) {
        e.preventDefault();
        
        console.log("Senha digitada:", password)
        console.log("Tipo de Conta Selecionada:", type)

        // Ajustei a requisição para enviar os campos do CADASTRO
        api.post("/register", { // Geralmente, cadastros vão para um endpoint /cadastro
            email: email,
            username: nome,
            password: password,
            passwordConfirm: passwordConfirm,
            userRole: type,
        }).then(function (response) {
            console.log("Resposta do Servidor:", response);
            // Exemplo de navegação após sucesso
            // navigate("/login"); 
        }).catch(function (error) {
            console.error("Erro no cadastro:", error);
            alert("Erro ao cadastrar. Verifique o console.");
        });
    };

    return (
        // Adicionando a estrutura do .container e .form-auth do CSS
        <main className="container">
            <section className="form-auth form-cadastro">
                
                {/* Logo CHECKPOINT */}
                <div className="logo-auth">
                    <div className="circle"></div>
                    <div className="text">CHECKPOINT</div>
                </div>
                
                <h1>CADASTRE-SE</h1>
                
                {/* O onSubmit chama a função handleSubmit, substituindo action/method do HTML */}
                <form onSubmit={handleSubmit}>
                    
                    {/* E-mail */}
                    <label htmlFor="email-cadastro">E-mail</label>
                    <input 
                        type="email" 
                        id="email-cadastro" 
                        placeholder="Insira seu endereço de e-mail..." 
                        required 
                        value={email} 
                        onChange={handleEmailChange} 
                        name="email" 
                    />
                    
                    {/* Nome de Usuário (NOVO CAMPO) */}
                    <label htmlFor="nome-usuario">Nome de Usuário</label>
                    <input 
                        type="text" 
                        id="nome-usuario" 
                        placeholder="Insira seu nome de usuário..." 
                        required 
                        value={nome} 
                        onChange={handleNameChange} 
                        name="username"
                    />
                    
                    {/* Senha */}
                    <label htmlFor="senha-cadastro">Senha</label>
                    <input 
                        type="password" 
                        id="senha-cadastro" 
                        placeholder="Insira sua senha..." 
                        required 
                        value={password} 
                        onChange={handlePasswordChange} 
                        name="password"
                    />
                    
                    {/* Confirmação de Senha */}
                    <label htmlFor="confirmar-senha">Confirmar Senha</label>
                    <input 
                        type="password" 
                        id="confirmar-senha" 
                        placeholder="Insira a senha novamente..." 
                        required 
                        value={passwordConfirm} 
                        onChange={handlePasswordConfirmChange} 
                        name="confirmarSenha"
                    />
                    
                    {/* Tipo de Conta (Radio Buttons) */}
                    <div className="type-selection">
                        <p>Tipo de Conta:</p>
                        <label>
                            <input 
                                type="radio" 
                                name="tipo-conta" 
                                value="organizador"
                                checked={type === "organizador"}
                                onChange={handleTypeChange}
                            /> ORGANIZADOR
                        </label>
                        <label>
                            <input 
                                type="radio" 
                                name="tipo-conta" 
                                value="jogador"
                                checked={type === "jogador"}
                                onChange={handleTypeChange}
                            /> JOGADOR
                        </label>
                        <label>
                            <input 
                                type="radio" 
                                name="tipo-conta" 
                                value="visitante"
                                checked={type === "visitante"} // Valor padrão
                                onChange={handleTypeChange}
                            /> VISITANTE
                        </label>
                    </div>
                    
                    {/* Botão de Submissão (usando a classe .btn) */}
                    <button type="submit" className="btn" style={{ marginTop: '20px' }}>
                        CADASTRAR
                    </button>

                    {/* Link de Login */}
                    <div className="auth-bottom-link">
                        Já possui uma conta? <Link to="/login">Log-in</Link>
                    </div>
                </form>
            </section>
        </main>
    );
}