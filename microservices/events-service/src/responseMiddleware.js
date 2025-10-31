function responseMiddleware(req, res, next) {
    /**
     * Resposta de sucesso padronizada
     * @param {any} data - Dados a serem retornados
     * @param {string} message - Mensagem de sucesso (opcional)
     * @param {number} status - Código de status HTTP (padrão: 200)
     */
    res.success = (data, message = "Success", status = 200) => {
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString()
        };

        if (data !== undefined && data !== null) {
            response.data = data;
        }

        return res.status(status).json(response);
    };

    /**
     * Resposta de erro padronizada
     * @param {string} message - Mensagem de erro
     * @param {string} errorCode - Código de erro (padrão: "INTERNAL_ERROR")
     * @param {number} status - Código de status HTTP (padrão: 400)
     * @param {any} details - Detalhes adicionais do erro (opcional)
     */
    res.error = (message, errorCode = "INTERNAL_ERROR", status = 400, details = null) => {
        const response = {
            success: false,
            message,
            error: errorCode,
            timestamp: new Date().toISOString()
        };

        if (details !== null && details !== undefined) {
            response.details = details;
        }

        return res.status(status).json(response);
    };

    next();
}

module.exports = responseMiddleware;

