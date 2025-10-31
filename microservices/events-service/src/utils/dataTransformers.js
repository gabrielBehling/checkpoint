/**
 * Funções utilitárias para transformar dados do banco de dados
 * Converte PascalCase para camelCase e enriquece com dados relacionados
 */

/**
 * Converte um objeto do banco (PascalCase) para formato de resposta (camelCase)
 */
function toCamelCase(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const mapping = {
        EventID: 'eventId',
        TeamID: 'teamId',
        TeamId: 'teamId',
        UserID: 'userId',
        GameID: 'gameId',
        CreatedBy: 'createdBy',
        LastModifiedBy: 'lastModifiedBy',
        TeamName: 'teamName',
        LogoURL: 'logoURL',
        StartDate: 'startDate',
        EndDate: 'endDate',
        MaxParticipants: 'maxParticipants',
        TeamSize: 'teamSize',
        MaxTeams: 'maxTeams',
        ParticipationCost: 'participationCost',
        BannerURL: 'bannerURL',
        IsOnline: 'isOnline',
        MemberCount: 'memberCount',
        RegisteredAt: 'registeredAt',
        CreatedAt: 'createdAt',
        UpdatedAt: 'updatedAt',
        EditedAt: 'editedAt',
        DeletedAt: 'deletedAt',
        Title: 'title',
        Description: 'description',
        Location: 'location',
        Mode: 'mode',
        Ticket: 'ticket',
        Language: 'language',
        Platform: 'platform',
        Rules: 'rules',
        Prizes: 'prizes',
        Status: 'status',
        GameName: 'gameName',
        Username: 'username',
        UserRole: 'userRole',
        Role: 'role',
        JoinedAt: 'joinedAt',
        ChatID: 'chatID'
    };

    const transformed = {};
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = mapping[key] || key.charAt(0).toLowerCase() + key.slice(1);
        transformed[camelKey] = value;
    }

    return transformed;
}

/**
 * Converte um array de objetos para camelCase
 */
function toCamelCaseArray(arr) {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => toCamelCase(item));
}

/**
 * Transforma um evento com dados relacionados
 */
function transformEvent(event, options = {}) {
    const transformed = toCamelCase(event);
    
    // Incluir informações do organizador se disponível
    if (options.organizer) {
        transformed.createdBy = {
            userId: options.organizer.UserID || options.organizer.userId,
            username: options.organizer.Username || options.organizer.username,
            userRole: options.organizer.UserRole || options.organizer.userRole
        };
    }

    // Incluir informações do jogo se disponível
    if (options.game) {
        transformed.game = {
            gameId: options.game.GameID || options.game.gameId,
            gameName: options.game.GameName || options.game.gameName
        };
    } else if (event.GameID || event.gameId) {
        // Placeholder se o jogo não foi carregado
        transformed.game = {
            gameId: event.GameID || event.gameId,
            gameName: null
        };
    }

    // Adicionar estatísticas se disponíveis
    if (options.stats) {
        transformed.currentParticipants = options.stats.currentParticipants || 0;
        transformed.availableSpots = transformed.maxParticipants 
            ? transformed.maxParticipants - (options.stats.currentParticipants || 0)
            : null;
        transformed.teamCount = options.stats.teamCount || 0;
        transformed.availableTeamSlots = transformed.maxTeams
            ? transformed.maxTeams - (options.stats.teamCount || 0)
            : null;
    }

    // Verificar se o usuário está registrado
    if (options.isRegistered !== undefined) {
        transformed.isRegistered = options.isRegistered;
    }

    // Adicionar metadados se disponíveis
    if (options.metadata) {
        transformed.metadata = {
            createdAt: options.metadata.CreatedAt || options.metadata.createdAt,
            updatedAt: options.metadata.EditedAt || options.metadata.EditedAt || options.metadata.updatedAt,
            lastModifiedBy: options.metadata.LastModifiedBy || options.metadata.lastModifiedBy
        };
    }

    return transformed;
}

/**
 * Transforma um time com dados relacionados
 */
function transformTeam(team, options = {}) {
    const transformed = toCamelCase(team);
    
    // Incluir informações do capitão se disponível
    if (options.captain) {
        transformed.captain = {
            userId: options.captain.UserID || options.captain.userId,
            username: options.captain.Username || options.captain.username,
            userRole: options.captain.UserRole || options.captain.userRole
        };
    }

    // Incluir membros se disponível
    if (options.members && Array.isArray(options.members)) {
        transformed.members = options.members.map(member => ({
            userId: member.UserID || member.userId,
            username: member.Username || member.username,
            role: member.Role || member.role,
            joinedAt: member.JoinedAt || member.joinedAt
        }));
    }

    // Adicionar informações sobre capacidade
    if (options.maxMembers !== undefined && transformed.memberCount !== undefined) {
        transformed.maxMembers = options.maxMembers;
        transformed.isFull = transformed.memberCount >= options.maxMembers;
        transformed.canJoin = !transformed.isFull && (options.canJoin !== false);
    }

    return transformed;
}

/**
 * Cria estrutura de paginação
 */
function createPagination(page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    return {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
}

/**
 * Transforma lista de eventos para formato de resposta
 */
function transformEventList(events, options = {}) {
    const transformedEvents = events.map(event => {
        const eventObj = toCamelCase(event);
        
        // Incluir dados básicos de organizador se disponível na query
        if (options.includeOrganizer && event.OrganizerUsername) {
            eventObj.organizer = {
                userId: event.CreatedBy || event.createdBy,
                username: event.OrganizerUsername
            };
        }

        // Incluir nome do jogo se disponível
        if (options.includeGame && event.GameName) {
            eventObj.gameName = event.GameName;
        }

        return eventObj;
    });

    return transformedEvents;
}

module.exports = {
    toCamelCase,
    toCamelCaseArray,
    transformEvent,
    transformTeam,
    createPagination,
    transformEventList
};

