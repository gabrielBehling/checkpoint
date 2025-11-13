import { useModal } from './useModal';

export const useCustomModal = () => {
  const { Modal, openModal, closeModal, isModalOpen } = useModal();

  const showInfo = (message, title = 'Informação') => {
    openModal({
      type: 'info',
      title,
      message,
      buttons: [{ label: 'OK', variant: 'primary', onClick: closeModal }]
    });
  };

  const showSuccess = (message, title = 'Sucesso!') => {
    openModal({
      type: 'success',
      title,
      message,
      buttons: [{ label: 'OK', variant: 'primary', onClick: closeModal }]
    });
  };

  const showError = (message, title = 'Erro!') => {
    openModal({
      type: 'success',
      title,
      message,
      buttons: [{ label: 'OK', variant: 'primary', onClick: closeModal }]
    });
  };

  const showWarning = (message, title = 'Atenção!') => {
    openModal({
      type: 'warning',
      title,
      message,
      buttons: [{ label: 'OK', variant: 'primary', onClick: closeModal }]
    });
  };

  const showConfirmation = (message, onConfirm, onCancel = closeModal, title = 'Confirmação') => {
    openModal({
      type: 'confirmation',
      title,
      message,
      buttons: [
        { label: 'Cancelar', variant: 'secondary', onClick: onCancel },
        { label: 'Confirmar', variant: 'primary', onClick: onConfirm }
      ]
    });
  };

  const showCustom = (config) => {
    openModal(config);
  };

  return {
    Modal,
    showInfo,
    showSuccess,
    showError,
    showWarning,
    showConfirmation,
    showCustom,
    closeModal,
    isModalOpen
  };
};