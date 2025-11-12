import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Adicionado
import "../assets/css/style-perfil.css";
import LOGO_IMG from "../assets/img/imagem.png";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PerfilPage() {
    const { user, loading, updateUserInfo, logout, deleteAccount, checkAuth } = useAuth();
    

    const [previewImage, setPreviewImage] = useState(null);
    const [previewBanner, setPreviewBanner] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }

        if (user) {
            // Define a role atual no formulário
            setSelectedRole(user.userRole);

            
            const profilePath = user.profileURL || null;
            if (profilePath) {
                const src = profilePath.startsWith("http")
                    ? profilePath
                    : `${window.location.origin}/api/auth${profilePath}`;
                setPreviewImage(src);
            }

            if (user.bannerImage) {
                setPreviewBanner(user.bannerImage);
            }
        }
    }, [user, loading, navigate]);

    // Atualiza a foto de perfil usando o Context
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setPreviewImage(previewUrl);

            const formData = new FormData();
            formData.append("ProfileFile", file); 

            try {
                await updateUserInfo(formData); 
                alert("Foto de perfil atualizada!");
            } catch (err) {
                console.error("Erro ao enviar imagem de perfil:", err);
                alert("Erro ao atualizar foto: " + err.message);
                // Reverte o preview se falhar
                const oldSrc = user.profileURL.startsWith("http")
                    ? user.profileURL
                    : `${window.location.origin}/api/auth${user.profileURL}`;
                setPreviewImage(oldSrc);
            }
        }
    };

   
    const handleBannerChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setPreviewBanner(previewUrl);

            const formData = new FormData();
           
            formData.append("BannerFile", file); 

            try {
                await updateUserInfo(formData); 
                alert("Banner atualizado!");
            } catch (err) {
                console.error("Erro ao enviar banner:", err);
                alert("Erro ao enviar banner: " + err.message);
                setPreviewBanner(user?.bannerImage || null);
            }
        }
    };

    // Submissão do formulário de troca de tipo de conta
    const handleRoleChangeSubmit = async (e) => {
        e.preventDefault();
        if (selectedRole === user.userRole) return;
        
        if (!window.confirm(`Deseja alterar seu tipo de conta para "${selectedRole}"?`)) {
            setSelectedRole(user.userRole);
            return;
        }

        const formData = new FormData();
        formData.append("userRole", selectedRole);

        try {
            await updateUserInfo(formData); 
            alert("Tipo de conta atualizado!");
        } catch (err) {
            console.error("Erro ao trocar tipo de conta:", err);
            alert("Erro ao trocar tipo de conta: " + err.message);
            setSelectedRole(user.userRole);
        }
    };

    // Logout usando o Context
    const handleLogout = async () => {
      if (!window.confirm("Tem certeza que deseja sair?")) {
            return;
        }
        try {
            await logout();
            navigate("/login");
            checkAuth();}
         catch (err) {
            console.error("Erro ao apagar conta:", err);
            alert("Erro ao apagar conta: " + err.message);
        }
    };

    // (NOVO) Delete usando o Context
    const handleDeleteAccount = async () => {
        if (!window.confirm("ATENÇÃO: Tem certeza que deseja apagar sua conta? Esta ação é irreversível.")) {
            return;
        }
        try {
            await deleteAccount();
            alert("Conta apagada com sucesso.");
            navigate("/");
            checkAuth();
        } catch (err) {
            console.error("Erro ao apagar conta:", err);
            alert("Erro ao apagar conta: " + err.message);
        }
    };

    // Tela de carregamento enquanto o context busca o usuário
    if (loading) {
        return <div>Carregando...</div>;
    }

    // Se não há usuário (e não está carregando), o useEffect já redirecionou
    if (!user) {
        return null;
    }

    return (
        <div className="perfil-container">
            <Header />

            <section className="perfil-banner">
                <div
                    className="background-img"
                    style={{
                        backgroundImage: previewBanner
                            ? `url(${previewBanner})`
                            : "linear-gradient(135deg, #241D3B, #100C1F)",
                    }}
                >
                    <label htmlFor="upload-banner" className="edit-banner-btn">
                        Alterar Banner
                        <input
                            id="upload-banner"
                            type="file"
                            accept="image/*"
                            onChange={handleBannerChange}
                            style={{ display: "none" }}
                        />
                    </label>

                    <div className="perfil-info">
                        <label htmlFor="upload-image" className="foto-perfil">
                            {previewImage ? (
                                <img
                                    src={previewImage}
                                    alt="Foto de perfil"
                                    className="perfil-img"
                                />
                            ) : (
                                <span>+</span>
                            )}
                            <input
                                id="upload-image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: "none" }}
                            />
                        </label>

                        <div className="status">
                            <span className="dot"></span> status: online
                        </div>

                        <div className="perfil-buttons">
                            {/* Usa 'user' do context */}
                            <button>{user.username || "Usuário"}</button> 
                            <Link to="/historico" className="btn">
                                Histórico
                            </Link>
                            <Link to="/chat">
                                <button type="submit" className="btn">
                                    Chat
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <main>
                <aside className="info-box">
                    <h3>Informações:</h3>
                    <p>
                        <strong>Nome:</strong> {user.username}
                    </p>
                    <p>
                        <strong>E-mail:</strong> {user.email}
                    </p>

                    {/* (NOVO) Formulário de Troca de Conta */}
                    <form className="role-form" onSubmit={handleRoleChangeSubmit}>
                        <label htmlFor="role-select">
                            <strong>Tipo da conta:</strong>
                        </label>
                        <select 
                            id="role-select"
                            value={selectedRole} 
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            <option value="Player">Jogador</option>
                            <option value="Organizer">Organizador</option>
                            <option value="Visitor">Visitante</option>
                            {user.userRole === 'Administrator' && (
                                <option value="Administrator">Administrator</option>
                            )}
                        </select>
                        <button 
                            type="submit" 
                            className="secondary" 
                            disabled={selectedRole === user.userRole || loading}
                        >
                            Salvar Alteração
                        </button>
                    </form>

                    <h3>Configurações</h3>
                    <p>
                        <strong>Idioma:</strong> Português BR
                    </p>
                    <p>
                        <strong>Notificações:</strong> ativadas
                    </p>
                    <button className="secondary">Trocar notificações</button>

                    
                    <div className="danger">
                        <button className="danger-link" onClick={handleLogout}>
                            Sair
                        </button>
                        <button className="danger-link" onClick={handleDeleteAccount}>
                            Apagar Conta
                        </button>
                    </div>
                </aside>

                <section className="participacoes">
                    <h3>Participações recentes</h3>
                    {/* Usa 'user.eventsHistory' do context */}
                    {user.eventsHistory?.length > 0 ? (
                        <div className="grid">
                            {user.eventsHistory.map((evento, index) => (
                                <div className="card" key={index}>
                                    <h4>{evento.title}</h4>
                                    <p>
                                        {new Date(evento.startDate).toLocaleDateString("pt-br")}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="sem-participacoes">
                            <p>Você ainda não participou de nenhum evento.</p>
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}