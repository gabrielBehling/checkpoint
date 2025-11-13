import { useState, useCallback } from 'react';
import Modal from '../components/Modal';

export const useModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
    children: null
  });

  const openModal = useCallback((config) => {
    setModalState({
      isOpen: true,
      type: 'info',
      title: '',
      message: '',
      buttons: [],
      children: null,
      ...config
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const ModalComponent = useCallback(({ customButtons, ...props }) => {
    return (
      <Modal
        {...modalState}
        onClose={closeModal}
        buttons={customButtons || modalState.buttons}
        {...props}
      />
    );
  }, [modalState, closeModal]);

  return {
    Modal: ModalComponent,
    openModal,
    closeModal,
    isModalOpen: modalState.isOpen
  };
};