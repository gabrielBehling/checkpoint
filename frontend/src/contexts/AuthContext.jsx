import { createContext, useContext, useState, useEffect } from 'react';
import api from '../pages/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const response = await api.get('/auth/me/');
            
            if (response.data.success) {
                setUser(response.data.data);
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Check auth status when the provider mounts
    useEffect(() => {
        checkAuth();
    }, []);

    const logout = async () => {
        try {
            await api.post('/auth/logout');
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };
  
    const updateUserInfo = async (formData) => {
        try {
            const response = await api.put('/auth/update-info', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                // Atualiza o estado do usuário na aplicação com os novos dados
                setUser(response.data.data);
                return response.data; 
            } else {
                throw new Error(response.data.message || 'Failed to update user info');
            }
        } catch (error) {
            console.error('Update user info error:', error);
            throw error; 
        }
    };

    // Função para deletar a conta do usuário (/auth/delete-account)
    const deleteAccount = async () => {
        try {
            const response = await api.delete('/auth/delete-account');
            
            if (response.data.success) {
                // Se a conta foi apagada, o usuário é deslogado
                setUser(null);
                return response.data;
            } else {
                throw new Error(response.data.message || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Delete account error:', error);
            throw error; 
        }
    };

    const value = {
        user,
        loading,
        checkAuth,
        logout,
        updateUserInfo, 
        deleteAccount  
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};