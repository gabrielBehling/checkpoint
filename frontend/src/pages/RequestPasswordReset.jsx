import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

function RequestResetPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    function handleEmailChange(e) {
        setEmail(e.target.value);
    }

    function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        
        api.post("/auth/request-password-reset", { email: email })
            .then((response) => {
                if (response.data.success) {
                    alert("Instruções para resetar a senha foram enviadas para o seu email.");
                    navigate("/login");
                }
            })
            .catch((error) => {
                console.error("Erro ao solicitar reset de senha:", error);
                alert("Erro ao solicitar reset de senha. Verifique o console.");
            })
            .finally(() => {
            setLoading(false);
        });
    }

    return (
        <>
            {loading && <div className="loading-overlay">Carregando...</div>}
            <h1>Solicitar Reset de Senha</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email</label>
                <input type="text" name="email" value={email} onChange={handleEmailChange} placeholder="Digite seu email: " required />

                <button type="submit">Resetar senha</button>
            </form>
            {/* Botão de voltar */}
            <button className="back-button" onClick={() => navigate("/")}>
                ← Voltar para o App
            </button>
        </>
    );
}

export default RequestResetPasswordPage;
