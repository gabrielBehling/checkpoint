import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCustomModal } from "../hooks/useCustomModal";
import "../assets/css/style-perfil.css"; 

import Header from "../components/Header";
import Footer from "../components/Footer";

// Ícones SVG simples
const IconCamera = () => (
  <svg 
    width="16" 
    height="16" 
    fill="var(--text-main)"
    viewBox="0 0 16 16"
  >
    <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
    <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z" />
  </svg>
)
const IconEdit = () => (
  <svg 
    width="14" 
    height="14" 
    fill="none" 
    stroke="var(--text-main)" 
    strokeWidth="2" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
  </svg>
);
export default function PerfilPage() {
    const { user, loading, updateUserInfo, logout, deleteAccount, checkAuth } = useAuth();
    const { showError, showSuccess } = useCustomModal();
    const navigate = useNavigate();

    const [previewImage, setPreviewImage] = useState(null);
    // [REMOVIDO] const [previewBanner, setPreviewBanner] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const getImageUrl = (path) => {
        if (!path) return null;
        return path.startsWith("http") ? path : `${window.location.origin}/api/auth${path}`;
    };

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
            return;
        }

        if (user) {
            setSelectedRole(user.userRole);
            setPreviewImage(getImageUrl(user.profileURL));
            // [REMOVIDO] setPreviewBanner(user.bannerImage);
        }
    }, [user, loading, navigate]);

    const handleImageError = (e) => {
        e.target.src = "https://via.placeholder.com/150/14122a/a78bfa?text=User";
    };

    // Função para lidar com a mudança do arquivo (somente perfil agora)
    const handleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        // Remove a verificação de tipo 'banner'
        if (type !== 'profile') return; 

        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);

        const formData = new FormData();
        formData.append("ProfileFile", file); // Apenas ProfileFile é enviado

        setIsUpdating(true);
        try {
            await updateUserInfo(formData);
            showSuccess("Foto atualizada!");
        } catch (err) {
            console.error(`Erro ao atualizar perfil:`, err);
            showError(`Erro ao atualizar: ${err.message}`);
            setPreviewImage(getImageUrl(user.profileURL));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRoleChangeSubmit = async (e) => {
        e.preventDefault();
        if (selectedRole === user.userRole) return;

        if (!window.confirm(`Confirmar alteração para "${selectedRole}"?`)) {
            setSelectedRole(user.userRole);
            return;
        }

        const formData = new FormData();
        formData.append("userRole", selectedRole);

        setIsUpdating(true);
        try {
            await updateUserInfo(formData);
            showSuccess("Tipo de conta atualizado!");
        } catch (err) {
            console.error("Erro role:", err);
            showError("Erro: " + err.message);
            setSelectedRole(user.userRole);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = async () => {
        if (!window.confirm("Deseja sair da conta?")) return;
        try {
            await logout();
            navigate("/login");
            checkAuth();
        } catch (err) {
            showError("Erro ao sair: " + err.message);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmStr = prompt("Para confirmar, digite 'DELETAR':");
        if (confirmStr !== "DELETAR") return;

        try {
            await deleteAccount();
            showSuccess("Conta apagada.");
            navigate("/");
            checkAuth();
        } catch (err) {
            showError("Erro ao apagar: " + err.message);
        }
    };

    if (loading) return <div className="loading-screen">Carregando...</div>;
    if (!user) return null;

    return (
        <>
            <Header />
            <div id="perfil-page-wrapper">
                <div className="perfil-container">

                    {/* NOVO: Seção de banner removida, substituída por um div simples para manter o espaçamento e fundo */}
                    <div 
                      className="perfil-banner-placeholder"
                      style={{ 
                        height: '150px', // Altura fixa para simular a área ocupada
                        background: "linear-gradient(135deg, #241D3B, #100C1F)", // Cor de fundo padrão
                        borderRadius: '8px 8px 0 0',
                        position: 'relative' 
                      }}
                    />


                    {/* === HEADER INFO (Foto flutuante) === */}
                    <div className="perfil-header-info">
                        <div className="foto-wrapper">
                            <label className="foto-perfil">
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="Perfil"
                                        className="perfil-img"
                                        onError={handleImageError}
                                    />
                                ) : (
                                    <span>{user.username?.charAt(0)}</span>
                                )}
                                <div className="foto-overlay">
                                    <IconCamera />
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => handleFileChange(e, 'profile')}
                                    disabled={isUpdating}
                                />
                            </label>
                        </div>

                        <div className="user-identity">
                            <h2>{user.username}</h2>
                            <div className="status">
                                <span className="dot"></span> Online
                            </div>
                        </div>

                        <div className="perfil-actions">
                            <Link to="/historico" className="btn-secondary">Histórico</Link>
                            <Link to="/chat" className="btn-primary">Abrir Chat</Link>
                        </div>
                    </div>

                    {/* === MAIN CONTENT === */}
                    <main>
                        {/* COLUNA DA ESQUERDA: Informações e Configurações */}
                        <aside className="card-box info-box">
                            <h3 className="section-title">
                                <IconEdit /> Dados da Conta
                            </h3>

                            <div className="info-group">
                                <div className="info-item">
                                    <strong>E-mail</strong>
                                    {user.email}
                                </div>

                                <form className="role-form" onSubmit={handleRoleChangeSubmit}>
                                    <label htmlFor="role-select"><strong>Tipo de Conta</strong></label>
                                    <select
                                        id="role-select"
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        disabled={isUpdating}
                                    >
                                        <option value="Player">Jogador</option>
                                        <option value="Organizer">Organizador</option>
                                        <option value="Visitor">Visitante</option>
                                        {user.userRole === 'Administrator' && <option value="Administrator">Admin</option>}
                                    </select>
                                    <button
                                        type="submit"
                                        className="btn-small"
                                        disabled={selectedRole === user.userRole || isUpdating}
                                    >
                                        {isUpdating ? 'Salvando...' : 'Salvar Tipo'}
                                    </button>
                                </form>
                            </div>

                            <div className="danger-zone">
                                <button className="btn-danger" onClick={handleLogout}>
                                    Sair da conta
                                </button>
                                <button className="btn-danger" onClick={handleDeleteAccount}>
                                    Excluir conta permanentemente
                                </button>
                            </div>
                        </aside>

                        {/* COLUNA DA DIREITA: Histórico */}
                        <section className="card-box participacoes">
                            <h3 className="section-title">Participações Recentes</h3>

                            {user.eventsHistory?.length > 0 ? (
                                <div className="events-grid">
                                    {user.eventsHistory.map((evento, index) => (
                                        <div className="event-card" key={index}>
                                            <h4>{evento.title}</h4>
                                            <div className="event-date">
                                                📅 {new Date(evento.startDate).toLocaleDateString("pt-br")}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>Nenhum evento participado recentemente.</p>
                                </div>
                            )}
                        </section>
                    </main>


                </div>

            </div>
            <Footer />
        </>
    );
}