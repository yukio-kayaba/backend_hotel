import express from 'express'
import {PORT} from './config.js'
import indexRoutes from './routes/indes.routes.js'
import cors from 'cors'
const app = express();

app.use(cors())

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/habitaciones',indexRoutes);

app.listen(PORT,()=>{
    console.log(`Server en linea en el puerto ${PORT}`);
});

