import { useNavigate } from "react-router-dom";
import "../assets/css/About_Us.css";

function AboutUsPage() {
  const navigate = useNavigate();

  return (
    <>
      <main className="about-container">
        <h1>Sobre o Checkpoint</h1>

        <p>
          O <strong>Checkpoint</strong> nasceu como um projeto de conclusão de curso,
          com um propósito claro: <strong>tornar o universo dos eSports mais acessível e organizado.</strong>
        </p>

        <p>
          Nossa plataforma foi desenvolvida para simplificar o <strong>gerenciamento de torneios</strong>,
          oferecendo ferramentas práticas tanto para <strong>organizadores</strong> quanto para <strong>jogadores</strong>.
        </p>

        <p>
          Mais do que um site, o Checkpoint é uma iniciativa voltada para o
          <strong> fortalecimento da comunidade competitiva</strong>, promovendo oportunidades,
          crescimento e profissionalização no cenário dos eSports.
        </p>

        {/* Botão de voltar */}
        <button className="back-button" onClick={() => navigate("/")}>
          ← Voltar para o App
        </button>
      </main>
    </>
  );
}

export default AboutUsPage;
