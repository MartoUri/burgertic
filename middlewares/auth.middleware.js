import jwt from "jsonwebtoken";
import UsuariosService from "../services/usuarios.service.js";
import "dotenv/config";

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ message: "Token no proporcionado" });

    const token = authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Token mal formado" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(401).json({ messanpmge: "Token inválido" });

        req.user = user;
        next();
    });
};

export const verifyAdmin = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await UsuariosService.getUsuarioById(userId);


        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        if (!user.admin) return res.status(403).json({ message: "Acceso denegado" });

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
