import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/requestPasswordReset.css";
import api from "./api";

import Header from "../components/Header";
import Footer from "../components/Footer";

function RequestResetPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    function handleEmailChange(e) {
        setEmail(e.target.value);
    }

    function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: "", type: "" });
        
        api.post("/auth/request-password-reset", { email: email })
            .then((response) => {
                if (response.data.success) {
                    setMessage({ 
                        text: "Instruções para resetar a senha foram enviadas para o seu email.", 
                        type: "success" 
                    });
                    setTimeout(() => navigate("/login"), 3000);
                }
            })
            .catch((error) => {
                console.error("Erro ao solicitar reset de senha:", error);
                setMessage({ 
                    text: "Erro ao solicitar reset de senha.", 
                    type: "error" 
                });
            })
            .finally(() => {
                setLoading(false);
            });
    }

    return (
        <><Header/>
        
        <div className="request-reset-container">
            
            {loading && <div className="loading-overlay">Carregando...</div>}
            
            <div className="request-reset-form">
                <h1>Resetar Senha</h1>
                
                {message.text && (
                    <div className={`status-message status-${message.type}`}>
                        {message.text}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <label htmlFor="email">Email</label>
                    <input 
                        type="email" 
                        name="email" 
                        value={email} 
                        onChange={handleEmailChange} 
                        placeholder="Digite seu email" 
                        required 
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Enviando..." : "Resetar Senha"}
                    </button>
                </form>
                
                <button className="back-button" onClick={() => navigate("/login")}>
                    ← Voltar para o Login
                </button>
            </div>
            
        </div>
        <Footer/></>
    );
}

export default RequestResetPasswordPage;