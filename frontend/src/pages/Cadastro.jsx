import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../assets/css/cadastro.css"; // Assumindo que este CSS agora contém os estilos fornecidos
import api from "./api"
import { useAuth } from "../contexts/AuthContext";

export default function CadastroPage() { // Mudei o nome para CadastroPage, pois a estrutura é de cadastro
    const navigate = useNavigate();
    const { checkAuth } = useAuth()

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

        api.post("/auth/register", {
            email: email,
            username: nome,
            password: password,
            passwordConfirm: passwordConfirm,
            userRole: type,
        }).then(function (response) {
            alert("Cadastro realizado com sucesso!");
            checkAuth();
            navigate("/"); 
        }).catch(function (error) {
            console.error("Erro no cadastro:", error);
            alert("Erro ao cadastrar. Verifique o console.");
            // TODO
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
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\.])[A-Za-z\d@$!%*?&\.]{8,}$"
                        title="A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial."
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
                                value="Organizer"
                                checked={type === "Organizer"}
                                onChange={handleTypeChange}
                            /> ORGANIZADOR
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="tipo-conta"
                                value="Player"
                                checked={type === "Player"}
                                onChange={handleTypeChange}
                            /> JOGADOR
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="tipo-conta"
                                value="Visitor"
                                checked={type === "Visitor"} // Valor padrão
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