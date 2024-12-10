import { Router } from "express";
import { pool } from "../basedatos.js";

function tokem_validator(ip){
    const userAgent = ip;
    const compressedInfo = userAgent.match(/(Windows NT|Mac OS X|Linux|Android|iPhone).*?(Chrome|Firefox|Safari|Edge|Opera)\/([\d.]+)/);
    const valor1 = getRandomInRange(1,150);

    let tokem = `t${valor1}`;
    if (compressedInfo) {
        const os = compressedInfo[1]; 
        const browser = compressedInfo[2]; 
        const version = compressedInfo[3];

        console.log(`Sistema operativo: ${os}`);
        console.log(`Navegador: ${browser}`);
        console.log(`Versión: ${version}`);
        tokem += `adm${os}n${browser}v${version}`;
        return tokem;
    }
}

const router = Router();
const convertidor_arrays_imagenes = (enlaces)=>{
    let datos = Array();
    let aux_texto = "";
    for (let i = 0; i < enlaces.length; i++) {
        if(enlaces[i] == ';'){
            datos.push(aux_texto);
            aux_texto = "";
        }else{
            aux_texto += enlaces[i];
        }
    }
    datos.push(aux_texto);
    return datos;
}
function getRandomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const validador = (texto)=>{
    const validador = /^[a-zA-Z_áéíóúÁÉÍÓÚ0-9\s]+$/;
    if(validador.test(texto)){
        return true;
    }
    return false;
}

router.post('/',async (req,res)=>{
    // const {id,id_token,token} = req.headers; 
    const {limite} = req.body;
    // console.log(limite); 
    const [rows] = await pool.query(`select * from informacion_habitaciones ORDER BY id_hab DESC`);
    // console.log(rows);
    rows.forEach(element => {
        if(element.enlaces != null){
            element.enlaces = convertidor_arrays_imagenes(element.enlaces);
        }
    });
    res.json(rows);
});

router.post('/fotos',async (req,res)=>{
    const {id} = req.body;
    const [rows] = await pool.query(`SELECT * FROM fotos_habitaciones where id_habitacion = ? ;`,[id]);   
    // console.log(id);
    // console.log(rows);
    if(rows){
        return res.json(rows);
    }
    res.send("error");
});

router.post('/add',async(req,res)=>{
    const {caracteristicas,cuartos,precio } = req.body;
    if(!validador(caracteristicas)) res.render("error");
});

router.post('/login_adm',async(req,res)=>{
    try {
        const {correo,contra,ip} = req.body;
        // console.log(req.body);
        const exp_email = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const exp_contra = /^[a-zA-Z0-9_áéíóúÁÉÍÓÚñÑçÇ\s]+$/;
    
        console.log(`correo : ${correo}  - contra : ${contra} - ip : ${ip} `);
        if(!exp_contra.test(contra) || !exp_email.test(correo)){
            return res.send("error de expresion");
        }
        let tokem = tokem_validator(ip);

        const [rows] = await pool.query("call inicio_sesion_adm(?, ? , ?);",[correo,contra,tokem]);
        if(rows.length > 0){
            return res.send(JSON.stringify(rows[0]));
        }
        res.send('error usuarios');
    } catch (error) {
        console.log(`error : ${error}`)
        res.send('error al enviar datos');
    }
});

router.post('/reporte_dias',async(req,res)=>{
    const {id,id_token,token} = req.headers;
    const {fecha} = req.body;
    const exp_contra = /^[a-zA-Z0-9_áéíóúÁÉÍÓÚñÑçÇ\s.\n]+$/;
    if(!exp_contra.test(token) || !exp_contra.test(id) || !exp_contra.test(id_token)){
        return res.send("token no valido");
    }
    
    const [datos] = await pool.query(`select a.correo from administradores a, tokens_user t where a.id = ${id} and t.id_token = ${id_token} and t.token = '${token}' and t.activo = '1';`); 

    if(datos[0]){
        const [rows] = await pool.query("call reporte( ? );",[fecha]);
        const [hors] = await pool.query("call VENTAS_DIARIAS_HORA( ? )",[fecha]);
        
        let datos_r = [JSON.stringify(rows[0]),JSON.stringify(hors[0])];
        // console.log(`datos _ r : ${JSON.stringify(datos_r)}`);
        return res.send(JSON.stringify(datos_r));
    }
    res.send("error data");
});
router.post('/reporte_mensual',async(req,res) => {
    const {id,id_token,token} = req.headers;
    const {fecha} = req.body;
    const exp_contra = /^[a-zA-Z0-9_áéíóúÁÉÍÓÚñÑçÇ\s.\n]+$/;
    if(!exp_contra.test(token) || !exp_contra.test(id) || !exp_contra.test(id_token)){
        return res.send("token no valido");
    }
    const [datos] = await pool.query(`select a.correo from administradores a, tokens_user t where a.id = ${id} and t.id_token = ${id_token} and t.token = '${token}' and t.activo = '1';`); 

    if(!String(fecha)){
        return res.send("el mes no es valido");
    }

    if(datos[0]){
        const [reporte_mensual] = await pool.query("call bd_hotel.suma_reporte_urh( ? );",[fecha]);
        return res.send(JSON.stringify(reporte_mensual[0]));
    }
    res.send("error data");
});

export default router;