import { config } from "../db.js";
import pkg from "pg";
const { Client } = pkg;

const getPlatosByPedido = async (idPedido) => {
    const client = new Client(config);
    await client.connect();

    try {
        const { rows } = await client.query(
            "SELECT * FROM pedidos_platos WHERE id_pedido = $1",
            [idPedido]
        );

        if (rows.length < 1) throw new Error("Pedido no encontrado");

        const result = await Promise.all(
            rows.map(async (plato) => {
                const { rows } = await client.query(
                    "SELECT * FROM platos WHERE id = $1",
                    [plato.id_plato]
                );

                if (rows.length < 1) throw new Error("Plato no encontrado");

                return {
                    ...rows[0],
                    cantidad: plato.cantidad,
                };
            })
        );

        await client.end();
        return result;
    } catch (error) {
        await client.end();
        throw error;
    }
};

const getPedidos = async () => {
    const client = new Client(config);
    await client.connect();

    try {
        const { rows } = await client.query("SELECT * FROM pedidos");

        if (rows.length < 1) return [];

        const result = await Promise.all(
            rows.map(async (pedido) => {
                const platos = await getPlatosByPedido(pedido.id);
                return {
                    ...pedido,
                    platos,
                };
            })
        );

        await client.end();
        return result;
    } catch (error) {
        await client.end();
        throw error;
    }
};

const getPedidoById = async (id) => {
    const client = new Client(config);
    await client.connect();

    try {
        const { rows } = await client.query(
            "SELECT * FROM pedidos WHERE id = $1",
            [id]
        );

        if (rows.length < 1) return null;

        const result = rows[0];

        result.platos = await getPlatosByPedido(id);

        await client.end();
        return result;
    } catch (error) {
        await client.end();
        throw error;
    }
};

const getPedidosByUser = async (idUsuario) => {
    const client = new Client(config);
    await client.connect();

    try {
        const { rows } = await client.query(
            "SELECT * FROM pedidos WHERE id_usuario = $1",
            [idUsuario]
        );

        if (rows.length < 1) return [];

        const result = await Promise.all(
            rows.map(async (pedido) => {
                const platos = await getPlatosByPedido(pedido.id);
                return {
                    ...pedido,
                    platos,
                };
            })
        );

        await client.end();
        return result;
    } catch (error) {
        await client.end();
        throw error;
    }
};

const createPedido = async (idUsuario, platos) => {
    const client = new Client(config);
    await client.connect();

    try {
        // Validar que los platos existan
        for (let plato of platos) {
            const { rows } = await client.query(
                "SELECT * FROM platos WHERE id = $1",
                [plato.id]
            );

            if (rows.length < 1) {
                await client.end();
                throw new Error("Plato no encontrado");
            }
        }

        // Crear el pedido
        const { rows } = await client.query(
            "INSERT INTO pedidos (id_usuario, fecha, estado) VALUES ($1, $2, 'pendiente') RETURNING id",
            [idUsuario, new Date()]
        );

        const idPedido = rows[0].id;

        // Agregar los platos al pedido
        for (let plato of platos) {
            await client.query(
                "INSERT INTO pedidos_platos (id_pedido, id_plato, cantidad) VALUES ($1, $2, $3)",
                [idPedido, plato.id, plato.cantidad]
            );
        }

        await client.end();
        return { id: idPedido };
    } catch (error) {
        await client.end();
        throw error;
    }
};

const updatePedido = async (id, estado) => {
    if (
        estado !== "aceptado" &&
        estado !== "en camino" &&
        estado !== "entregado"
    )
        throw new Error("Estado inválido");

    const client = new Client(config);
    await client.connect();

    try {
        const { rowCount } = await client.query(
            "UPDATE pedidos SET estado = $1 WHERE id = $2",
            [estado, id]
        );

        if (rowCount === 0) throw new Error("Pedido no encontrado");

        await client.end();
        return { message: "Pedido actualizado con éxito" };
    } catch (error) {
        await client.end();
        throw error;
    }
};

const deletePedido = async (id) => {
    const client = new Client(config);
    await client.connect();

    try {
        // Primero eliminar los platos del pedido
        await client.query(
            "DELETE FROM pedidos_platos WHERE id_pedido = $1",
            [id]
        );

        // Luego eliminar el pedido
        const { rowCount } = await client.query(
            "DELETE FROM pedidos WHERE id = $1",
            [id]
        );

        if (rowCount === 0) throw new Error("Pedido no encontrado");

        await client.end();
        return { message: "Pedido eliminado con éxito" };
    } catch (error) {
        await client.end();
        throw error;
    }
};

export default {
    getPedidos,
    getPedidoById,
    getPedidosByUser,
    createPedido,
    updatePedido,
    deletePedido,
};
