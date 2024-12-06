import { Router } from "express";
import { pool } from "../basedatos";

const Ruta = Router();

Ruta.post('/', async(req,res) => {
    const {} = req.body;

});


export default Ruta;

