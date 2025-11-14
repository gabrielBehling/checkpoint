import { Link } from "react-router-dom";
import "../assets/css/hf.css";

function Footer() {
  return (
    <footer>
      <ul>
        <li>
          <Link to="/ajuda">Ajuda</Link>
        </li>
        <li>
          <Link to="/contato">Contato</Link>
        </li>
        <li>
          <Link to="/aboutUs">Sobre nós</Link>
        </li>
        <li>
          <Link to="/termos">Termos</Link>
        </li>
      </ul>
    </footer>
  );
}

export default Footer;
