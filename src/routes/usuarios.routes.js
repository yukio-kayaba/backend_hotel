import { Router } from "express";
import { pool } from "../basedatos";

const Ruta = Router();

Ruta.post('/', async(req,res) => {
    const {id_user,tokem,id_tokem} = req.headers;
    const {cantidad} = req.body;
    res.send("hola");
}); 


export default Ruta;