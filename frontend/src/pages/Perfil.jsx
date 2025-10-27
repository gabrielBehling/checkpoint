import { React, useState, useEffect } from "react";
import "./cssPerfil.css";
import api from "./api";

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
                setUserData(response.data.user);
                
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
        <div className="perfil-page">
            <header className="header">
                <h1>Meu Perfil</h1>
            </header>

            <main className="perfil-container">
                <section className="perfil-info">
                    <h2>Informações do Usuário</h2>
                    <p><strong>Nome:</strong> {userData.Username}</p>
                    <p><strong>Email:</strong> {userData.Email}</p>
                    <p><strong>Tipo de conta:</strong> {userData.UserRole}</p>
                </section>

                {/* <section className="meus-campeonatos">
                    <h2>Meus Campeonatos</h2>
                    <ul>
                        {userData.campeonatos.map((campeonato, index) => (
                            <li key={index}>{campeonato.nome} - {campeonato.data}</li>
                        ))}
                    </ul>
                </section> */}
            </main>
        </div>
    );
}