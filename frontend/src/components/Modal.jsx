import '../assets/css/Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  type = 'info', 
  title, 
  message, 
  buttons = [],
  children 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'confirmation':
        return '❓';
      default:
        return 'ℹ️';
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'success':
        return 'Sucesso!';
      case 'error':
        return 'Erro!';
      case 'warning':
        return 'Atenção!';
      case 'info':
        return 'Informação';
      case 'confirmation':
        return 'Confirmação';
      default:
        return 'Informação';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-header modal-${type}`}>
          <div className="modal-icon">{getIcon()}</div>
          <h2 className="modal-title">{getTitle()}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {message && <p className="modal-message">{message}</p>}
          {children}
        </div>
        
        {buttons.length > 0 && (
          <div className="modal-footer">
            {buttons.map((button, index) => (
              <button
                key={index}
                className={`modal-button ${button.variant || 'secondary'}`}
                onClick={button.onClick}
                disabled={button.disabled}
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;