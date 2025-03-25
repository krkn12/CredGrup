const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send({ error: 'Token não fornecido' });
        }

        const token = authHeader.replace('Bearer ', '');
        console.log('Token recebido no authMiddleware:', token);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Erro no authMiddleware:', error.message);
        res.status(401).send({ error: 'Autenticação falhou' });
    }
};

module.exports = authMiddleware;