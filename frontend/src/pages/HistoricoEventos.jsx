import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from './api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../assets/css/cssHistorico.css';

function HistoricoEventos() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await api.get("/auth/me/");
                
                if (response.data && response.data.success) {
                    setUserData(response.data.data);
                } else {
                    throw new Error("Falha ao autenticar usuário.");
                }

            } catch (err) {
                console.error("Erro ao buscar dados do usuário:", err);
                setError("Falha ao carregar o histórico. Tente novamente mais tarde.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []); 

    // Define os eventos a serem exibidos com base no userData
    const eventos = userData?.eventsHistory || [];

    return (
        <>         
            <div className="historico-container">
                <Header />
                <main className="historico-content">
                    <div className="historico-header">
                        <h1>Histórico de Eventos</h1>
                        <Link to="/perfil" className="btn-voltar">
                            Voltar ao Perfil
                        </Link>
                    </div>

                    {loading && (
                        <div className="loading-message">Carregando histórico...</div>
                    )}
                    
                    {!loading && error && (
                        <div className="error-message">{error}</div>
                    )}
                    
                    {!loading && !error && eventos.length === 0 && (
                        <div className="empty-message">
                            <p>Você ainda não participou de nenhum evento.</p>
                            <Link to="/" className="btn" style={{marginTop: '20px', display: 'inline-block', background: '#6C63FF'}}>
                                Explorar Eventos
                            </Link>
                        </div>
                    )}

                    {!loading && !error && eventos.length > 0 && (
                        <div className="grid-eventos">
                            {/* Mapeia o array eventsHistory que veio do userData */}
                            {eventos.map((evento, index) => (
                                <Link to={`/evento/${evento.eventId || evento.id}`} className="evento-card" key={evento.eventId || evento.id || index}>
                                    <h3>{evento.title || evento.nome}</h3>
                                    <p>
                                        <strong>Data:</strong> {new Date(evento.startDate || evento.data_evento).toLocaleDateString('pt-BR')}
                                    </p>
                                    <p>
                                        <strong>Local:</strong> {evento.location || (evento.isOnline ? 'Online' : 'Não definido')}
                                    </p>
                                    <p>
                                        <strong>Status:</strong> {evento.status || 'Agendado'}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}
                </main>
                <Footer />
            </div>
        </>
    );
}

export default HistoricoEventos;