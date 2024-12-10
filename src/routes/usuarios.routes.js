import { Router } from "express";
import { pool } from "../basedatos.js";

const Ruta = Router();

Ruta.post('/', async(req,res) => {
    const {id_user,tokem,id_tokem} = req.headers;
    const {cantidad} = req.body;
    const [datos] = await pool.query(`select a.correo from administradores a, tokens_user t where a.id = ${id_user} and t.id_token = ${id_tokem} and t.token = '${tokem}' and t.activo = '1';`); 
    // console.log(`id_user ${id_user} id_tokem : ${id_tokem} tokem : ${tokem}`);
    if(datos[0]){
        const [rows] = await pool.query("select id_user,nombre,apellido,dni,fecha_creacion from usuarios_clientes;");
        
        // console.log(`datos _ r : ${JSON.stringify(rows)}`);
        return res.json(rows);
    }
    res.send("hola");
}); 


export default Ruta;