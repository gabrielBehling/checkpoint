<header>
                <nav className="navbar">
                    {/* ✅ Logo com imagem circular */}
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
                        <li>
                            <a href="#">Jogos</a>
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
                                <li>
                                    <Link to="/cadastroEvento">
                                        Cadastro Evento
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        onClick={logout}
                                        className="logout-btn"
                                    >
                                        Logout
                                    </button>
                                </li>
                                <li className="user-welcome">
                                    <Link to="/perfil" className="user-link">
                                        {user?.profileURL ? (
                                            <img
                                                src={getProfileSrc(
                                                    user.profileURL
                                                )}
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
