import UsuariosService from "../services/usuarios.service.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config"; 

const register = async (req, res) => {
    const { nombre, apellido, email, password } = req.body || {};

    if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({ message: "Faltan campos por llenar" });
    }

    try {
        const existingUser = await UsuariosService.getUsuarioByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "El usuario ya existe" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await UsuariosService.createUsuario({ nombre, apellido, email, password: hashedPassword });
        res.status(201).json({ message: "Usuario creado con éxito" });
    } catch (error) {
        console.error('Error creating user:', error); 
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email y password requeridos" });
    }

    try {
        const usuario = await UsuariosService.getUsuarioByEmail(email);
        if (!usuario) {
            return res.status(400).json({ message: "Usuario no encontrado" });
        }

        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Contraseña incorrecta" });
        }

        const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ usuario, token });
    } catch (error) {
        console.error('Error during login:', error); // Debug log
        res.status(500).json({ message: error.message });
    }
};

export default { register, login };
