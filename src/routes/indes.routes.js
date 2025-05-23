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
    if(rows[0]){
        return res.json(rows);
    }
    res.send("error");
});

router.post('/addImage',async(req,res)=>{
    const {caracteristicas,precio,imagenes } = req.body;
    if(!validador(caracteristicas)) return res.send("error");
    // console.log(`caracteristicas : ${caracteristicas}  - precio ${precio}  - ${ JSON.parse(imagenes)}`);    
    const [rows] = await pool.query("call bd_hotel.agregar_habitaciones( ? , ? );",[caracteristicas,precio]);
    if(rows[0]){
        let aux_id =rows[0][0]['id_habitacion']; 
        // console.log(aux_id);
        let imagenes_aux = JSON.parse(imagenes);
        let consulta = "INSERT INTO fotos_habitaciones(`id_habitacion`, `url_imagen`) VALUES ?";
        let valores = imagenes_aux.map(element => [aux_id, element]);

        const [resultado] = await pool.query(consulta, [valores]);
        console.log(resultado.affectedRows);
    }
    res.send("hola");
});

router.post('/ubdateImage',async (req,res)=>{
    const {id,id_tokem,tokem} = req.headers;
    const {id_actualizar,caracteristicas,precio,imagenes_nuevas,imagenes_update} = req.body;
    const {fecha} = req.body;
    const exp_contra = /^[a-zA-Z0-9_áéíóúÁÉÍÓÚñÑçÇ\s.\n]+$/;
    if(!exp_contra.test(tokem) || !exp_contra.test(id) || !exp_contra.test(id_tokem)){
        return res.send("token no valido");
    }
    const [datos] = await pool.query(`select a.correo from administradores a, tokens_user t where a.id = ${id} and t.id_token = ${id_tokem} and t.token = '${tokem}' and t.activo = '1';`); 
    console.log(`id : ${id_actualizar} - carac : ${caracteristicas} - price: ${precio} -- new image : ${imagenes_nuevas} -- iamgenes: ${imagenes_update}`);
    // return res.send("hola");
    if(datos[0]){
        let [update] = await pool.query("UPDATE `habitaciones` SET `caracteristicas` = ?, `precio` = ? WHERE (`id_hab` =  ? );",[caracteristicas,precio,id_actualizar]);
        let imagenes_aux = JSON.parse(imagenes_nuevas);
        if(imagenes_aux.length > 0){
            let consulta = "INSERT INTO fotos_habitaciones(`id_habitacion`, `url_imagen`) VALUES ?";
            let valores = imagenes_aux.map(element => [id_actualizar, element]);
            const [resultado] = await pool.query(consulta, [valores]);
        }

        let imagenes_update_aux = JSON.parse(imagenes_update);
        if(imagenes_update_aux.length  > 0){
            let consulta_2 = "UPDATE `fotos_habitaciones` SET `url_imagen` = ?  WHERE (`id_fotos` =  ? );";
            imagenes_update_aux.forEach(async(element) => {
                let url,id;
                url = element['url'];
                id = element['id_foto'];
                let [afectados] = await pool.query(consulta_2,[url,id]);
            });
        }
        return res.send('actualizado');
    }
    res.send('hola');
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