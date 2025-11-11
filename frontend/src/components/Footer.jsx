import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer>
      <ul>
        <li>
          <a href="#">Ajuda</a>
        </li>
        <li>
          <a href="#">Contato</a>
        </li>
        <li>
          <Link to="/aboutUs">Sobre nós</Link>
        </li>
        <li>
          <a href="#">Termos</a>
        </li>
      </ul>
    </footer>
  );
}

export default Footer;
