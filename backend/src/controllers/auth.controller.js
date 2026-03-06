const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/prismaClient');

const JWT_SECRET = process.env.JWT_SECRET || 'ci-dashboard-secret-2026';

exports.login = async (req, res) => {
  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({ error: 'Login e senha sao obrigatorios' });
    }

    const usuario = await prisma.apps_usuarios.findFirst({
      where: {
        login: login,
        ci: true,
      },
    });

    if (!usuario || !usuario.senha) {
      return res.status(401).json({ error: 'Credenciais invalidas ou acesso nao autorizado' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais invalidas' });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        login: usuario.login,
        nome: usuario.nome,
        cargo: usuario.cargo,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log(`[Auth] Login bem-sucedido: ${usuario.nome} (${usuario.cargo})`);

    return res.status(200).json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        login: usuario.login,
        cargo: usuario.cargo,
      },
    });
  } catch (error) {
    console.error('[Auth] Erro no login:', error.message);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
