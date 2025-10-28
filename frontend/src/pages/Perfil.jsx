import { React, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api";
import "../assets/css/style-perfil.css";


export default function PerfilPage() {
    const [userData, setUserData] = useState({
        Username: "",
        Email: "",
        UserRole: ""
    });

    // Simulating API call to get user data
    useEffect(() => {
        // This should be replaced with your actual API endpoint
        api.get("/auth/me/")
            .then(response => {
                setUserData(response.data);

            })
            .catch(error => {
                console.error("Erro ao buscar dados do usuário:", error);
            });

        // // For development/testing purposes, you can use this mock data:
        // setUserData({
        //     nome: "João Silva",
        //     email: "joao@email.com",
        //     campeonatos: [
        //         { nome: "LoL Nordeste", data: "10/08/2025" },
        //         { nome: "Valorant Nordeste", data: "14/08/2025" },
        //         { nome: "FIFA 23 Legends", data: "20/08/2025" }
        //     ]
        // });
    }, []);

    return (
        <div>
            <header>
                <div className="logo">
                    <a href="index.html">Logo</a>
                </div>
                <nav>

                    <a href="#">Eventos</a>
                    <a href="#">Jogos</a>
                </nav>
            </header>

            {/* ====== BANNER PERFIL ====== */}
            <section className="perfil-banner">
                <div className="background-img">
                    <div className="perfil-info">
                        <div className="foto-perfil"></div>
                        <div className="status">
                            <span className="dot"></span> status: online, offline
                        </div>
                        <div className="perfil-buttons">
                            <button>Nome usuário</button>
                            <Link to="/" className="btn">Histórico</Link>
                            <Link to="/chat"><button type="submit" className="btn">Chat</button></Link>
                        </div>
                    </div>
                </div>  
            </section>

            {/* ====== CONTEÚDO PRINCIPAL ====== */}
            <main>
                <aside className="info-box">
                    <h3>Informações:</h3>
                    <p><strong>Nome:</strong> {userData.Username}</p>
                    <p><strong>E-mail:</strong> {userData.Email}</p>
                    <p><strong>Tipo da conta:</strong> {userData.UserRole}</p>
                    <button className="secondary">Trocar tipo da conta</button>

                    <h3>Configurações</h3>
                    <p><strong>Idioma:</strong> Português BR</p>
                    <p><strong>Notificações:</strong> ativadas</p>
                    <button className="secondary">Trocar notificações</button>

                    <div className="danger"> <Link to="/logout">Sair</Link></div>

                </aside>

                <section className="participacoes">
                    <h3>Participações recentes.</h3>
                    <div className="grid">
                        <div className="card"></div>
                        <div className="card"></div>
                        <div className="card"></div>
                        <div className="card"></div>
                    </div>
                </section>
            </main>

            {/* ====== FOOTER ====== */}
            <footer>
                <a href="#">Ajuda</a>
                <a href="#">Contato</a>
                <a href="#">Sobre-Nós</a>
            </footer>
        </div>
    );
}