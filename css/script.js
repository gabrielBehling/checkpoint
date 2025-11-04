// ==========================================================
// 1. LÓGICA DO CARROSSEL (Usado na index.html)
// (Mantida inalterada)
// ==========================================================

const cards = document.querySelectorAll('.card');
let current = 0;

function updateCarousel() {
    cards.forEach((card, index) => {
        card.className = "card"; // reset

        if (index === current) {
            card.classList.add('active');
        } else if (index === (current - 1 + cards.length) % cards.length) {
            card.classList.add('left');
        } else if (index === (current + 1) % cards.length) {
            card.classList.add('right');
        } else if (index === (current - 2 + cards.length) % cards.length) {
            card.classList.add('left-far');
        } else if (index === (current + 2) % cards.length) {
            card.classList.add('right-far');
        }
    });
}

// Verifica se os elementos do carrossel existem antes de adicionar listeners
if (cards.length > 0) {
    updateCarousel();

    const prevButton = document.getElementById('prev');
    if (prevButton) {
        prevButton.onclick = () => {
            current = (current - 1 + cards.length) % cards.length;
            updateCarousel();
        };
    }

    const nextButton = document.getElementById('next');
    if (nextButton) {
        nextButton.onclick = () => {
            current = (current + 1) % cards.length;
            updateCarousel();
        };
    }

    let autoSlide = setInterval(() => {
        current = (current + 1) % cards.length;
        updateCarousel();
    }, 3000); 
}


// ==========================================================
// 2. LÓGICA DE CADASTRO DE EVENTOS (Usado na página de cadastro)
// COM ADIÇÃO DA LÓGICA DE PRÉ-VISUALIZAÇÃO DO BANNER
// ==========================================================

const formCadastro = document.getElementById('formCadastroEvento'); 
const urlInput = document.getElementById('urlImagem');
const previewImage = document.getElementById('previewBanner');
const bannerContainer = document.querySelector('.banner-upload');
const placeholderText = document.querySelector('.placeholder-text');

/**
 * Função para limpar os campos do formulário após o cadastro.
 */
function limparCampos() {
    const nomeInput = document.getElementById('nomeEvento');
    const dataInput = document.getElementById('dataEvento');
    const localInput = document.getElementById('plataforma');
    const urlInput = document.getElementById('urlImagem'); // Adicionado
    
    if (nomeInput) nomeInput.value = "";
    if (dataInput) dataInput.value = "";
    if (localInput) localInput.value = "";
    if (urlInput) urlInput.value = ""; // Limpa o campo de URL

    // Limpa também a pré-visualização
    if (previewImage) {
        previewImage.src = '';
        previewImage.style.display = 'none';
    }
    if (placeholderText) {
        placeholderText.style.display = 'block';
    }
}

/**
 * Função para atualizar a pré-visualização da imagem do banner.
 */
function updateBannerPreview() {
    if (!urlInput || !previewImage) return;

    const url = urlInput.value.trim();

    if (url) {
        previewImage.src = url;
        
        // Listener para sucesso no carregamento
        previewImage.onload = () => {
            previewImage.style.display = 'block'; 
            if (placeholderText) {
                placeholderText.style.display = 'none';
            }
        };
        
        // Listener para erro no carregamento
        previewImage.onerror = () => {
            previewImage.style.display = 'none'; 
            // Opcional: alert('⚠️ URL de imagem inválida.');
            if (placeholderText) {
                placeholderText.style.display = 'block';
            }
        };

    } else {
        // Se o campo estiver vazio
        previewImage.style.display = 'none';
        previewImage.src = '';
        if (placeholderText) {
            placeholderText.style.display = 'block';
        }
    }
}

/**
 * Função principal para cadastrar o evento.
 */
function cadastrarEvento(event) {
    if (!formCadastro) return; 
    
    event.preventDefault(); 

    const nome = document.getElementById('nomeEvento').value;
    const data = document.getElementById('dataEvento').value;
    const local = document.getElementById('plataforma').value; 
    // Captura o valor da URL da imagem
    const urlImagem = document.getElementById('urlImagem').value.trim(); 

    if (!nome || !data || !local) {
        alert("Preencha todos os campos obrigatórios (Nome, Data e Plataforma)!");
        return;
    }

    // Adiciona a urlImagem ao objeto do evento
    const evento = { nome, data, local, urlImagem };
    
    const eventosSalvos = JSON.parse(localStorage.getItem('eventosCheckpoint')) || [];
    eventosSalvos.push(evento);
    localStorage.setItem('eventosCheckpoint', JSON.stringify(eventosSalvos));

    limparCampos();
    alert(`🎉 Evento "${nome}" cadastrado com sucesso e salvo!`);
}


// Adiciona os event listeners
if (formCadastro) {
    formCadastro.addEventListener('submit', cadastrarEvento);
}

// Adiciona listeners para pré-visualização do banner
if (urlInput) {
    urlInput.addEventListener('input', updateBannerPreview);
    urlInput.addEventListener('blur', updateBannerPreview);
    document.addEventListener('DOMContentLoaded', updateBannerPreview); // Tenta carregar se houver algo no campo ao iniciar
}


// ==========================================================
// 3. LÓGICA DE EXIBIÇÃO DE EVENTOS (Usado na index.html)
// ATUALIZADA PARA EXIBIR A IMAGEM DO BANNER
// ==========================================================

function carregarEExibirEventosNoIndex() {
  const container = document.getElementById('lista-eventos');
  if (!container) return; 

  const eventosSalvosString = localStorage.getItem('eventosCheckpoint');
  const eventos = eventosSalvosString ? JSON.parse(eventosSalvosString) : [];

  if (eventos.length === 0) {
      container.innerHTML = '<p>Nenhum evento cadastrado ainda. Crie o seu na página de Eventos!</p>';
      return;
  }
  
  container.innerHTML = '';
  
  const eventosGrid = document.createElement('div');
  eventosGrid.style.display = 'grid'; 
  eventosGrid.style.gap = '20px'; 
  eventosGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))'; 
  container.appendChild(eventosGrid);

  eventos.forEach((ev) => {
      // Define a URL da imagem. Usa uma imagem padrão se nenhuma URL for fornecida.
      const imagemSrc = ev.urlImagem || 'placeholder-evento.jpg'; // Substitua 'placeholder-evento.jpg' pela sua imagem padrão
      
      // Codifica o nome do evento para uso na URL
      const nomeCodificado = encodeURIComponent(ev.nome);
      
      const card = document.createElement('div');
      card.classList.add('evento-card');
      
      card.innerHTML = `
          <div class="imagem-evento" style="background-image: url('${imagemSrc}'); background-size: cover; background-position: center;"></div>
          <div class="info-evento">
              <h3>${ev.nome}</h3>
              <p>
                  📅 Data: <strong>${ev.data}</strong><br>
                  📍 Local/Plataforma: <strong>${ev.local}</strong>
              </p>
              <a href="detalhes-evento.html?nome=${nomeCodificado}" class="btn">Ver Detalhes</a>
          </div>
      `;
      eventosGrid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', carregarEExibirEventosNoIndex);