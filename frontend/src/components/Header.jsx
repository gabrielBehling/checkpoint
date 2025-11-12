import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LOGO_IMG from "../assets/img/imagem.png"; // ✅ caminho ajustado
import "../assets/css/hf.css";

function Header() {
  const { user, logout } = useAuth();

  const getProfileSrc = (profilePath) => {
    if (!profilePath) return null;
    if (profilePath.startsWith("http")) return profilePath;
    return `${window.location.origin}/api/auth${profilePath}`;
  };

  return (
    <header>
      <nav className="navbar">
        {/* ✅ Logo circular */}
        <div className="logo">
          <Link to="/">
            <div className="logo-circle">
              <img src={LOGO_IMG} alt="Logo do site" />
            </div>
          </Link>
        </div>

        <h1>
          <input id="pesquisa" type="text" placeholder="Pesquisa" />
        </h1>

        <ul>
          <li>
            <Link to="/eventos">Eventos</Link>
          </li>

          {!user ? (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/cadastro">Cadastre-se</Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/chat">Chat</Link>
              </li>
              {user.userRole !== "Player" && (
                <li>
                  <Link to="/dashboardOrganizador">Gerenciar Eventos</Link>
                </li>
              )}
              <li className="user-welcome">
                <Link to="/perfil" className="user-link">
                  {user?.profileURL ? (
                    <img
                      src={getProfileSrc(user.profileURL)}
                      alt={user.username}
                      className="nav-avatar"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        marginRight: 8,
                      }}
                    />
                  ) : null}
                  Olá, {user.username}
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
