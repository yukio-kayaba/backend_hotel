create database bd_hotel;

use bd_hotel;


CREATE TABLE `administradores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `correo` VARCHAR(245) NULL,
  `nombre` VARCHAR(234) NULL,
  `contra` VARCHAR(145) NULL,
  PRIMARY KEY (`id`));

CREATE TABLE `fotos_habitaciones` (
  `id_fotos` INT NOT NULL AUTO_INCREMENT,
  `id_habitacion` INT NULL,
  `url_imagen` VARCHAR(345) NULL,
  PRIMARY KEY (`id_fotos`));

CREATE TABLE `habitaciones` (
  `id_hab` INT NOT NULL AUTO_INCREMENT,
  `caracteristicas` VARCHAR(245) NULL,
  `cuartos` INT NULL,
  `precio` DECIMAL(10,0) NULL,
  `fecha_registro` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(),
  `disponibilidad` VARCHAR(45) NULL DEFAULT 'activo',
  PRIMARY KEY (`id_hab`));

CREATE TABLE `reclamos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NULL,
  `reclamo` VARCHAR(345) NULL,
  `fecha` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`));


CREATE TABLE `registro_habitaciones` (
  `id_registro` INT NOT NULL AUTO_INCREMENT,
  `id_cliente` INT NULL,
  `id_habitacion` INT NULL,
  `fecha_reservacion` DATETIME NULL,
  `fecha_inicio` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(),
  `fecha_final` DATETIME NULL,
  `tipo` VARCHAR(45) NULL DEFAULT 'reservacion',
  PRIMARY KEY (`id_registro`));

CREATE TABLE `tokens_user` (
  `id_token` INT NOT NULL AUTO_INCREMENT,
  `id_user` INT NULL,
  `token` VARCHAR(145) NULL,
  `activo` TINYINT NULL DEFAULT 1,
  `token_registro` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id_token`));

CREATE TABLE `usuarios_clientes` (
  `id_user` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(145) NULL,
  `apellido` VARCHAR(145) NULL,
  `dni` VARCHAR(9) NULL,
  `usuario_acceso` VARCHAR(145) NULL,
  `correo` VARCHAR(145) NULL,
  `contra` VARCHAR(115) NULL,
  `fecha_creacion` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id_user`));

CREATE TABLE `usuarios_personal` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `correo` VARCHAR(245) NULL,
  `nombre` VARCHAR(145) NULL,
  `DNI` VARCHAR(9) NULL,
  `apellido` VARCHAR(245) NULL,
  `contra` VARCHAR(145) NULL,
  `codigo_seguridad` VARCHAR(15) NULL,
  `fecha_creacion` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(),
  `fecha_actualizacion` DATETIME NULL,
  PRIMARY KEY (`id`));


CREATE VIEW informacion_habitaciones AS select h.*,count(ft.id_fotos) as cantidad_imagenes,group_concat(ft.url_imagen SEPARATOR ';') as enlaces from habitaciones h
LEFT JOIN fotos_habitaciones ft ON h.id_hab = ft.id_habitacion GROUP BY h.id_hab;

create view login_dates as SELECT id_user,correo,contra FROM bd_hotel.usuarios_clientes;

create view reporte_usuarios_dias as SELECT DATE(fecha_creacion) as fecha , count(id_user) as suma_users from usuarios_clientes group by DATE(fecha_creacion);
select * from reporte_usuarios_dias;


create view reporte_habitaciones_dias as SELECT DATE(fecha_reservacion) as fecha , count(id_registro) as suma_users from registro_habitaciones group by DATE(fecha_reservacion);


create view reporte_reclamos_dias as SELECT DATE(fecha) as fecha , count(id) as suma_datos from reclamos group by DATE(fecha);

CREATE VIEW `bd_hotel`.`deuda_clientes` AS
    SELECT 
        `uc`.`id_user` AS `id_user`,
        `uc`.`nombre` AS `nombre`,
        SUM(`h`.`precio`) AS `deuda`
    FROM
        ((`bd_hotel`.`usuarios_clientes` `uc`
        JOIN `bd_hotel`.`habitaciones` `h`)
        JOIN `bd_hotel`.`registro_habitaciones` `rh`)
    WHERE
        `uc`.`id_user` = `rh`.`id_cliente`
            AND `h`.`id_hab` = `rh`.`id_habitacion`
    GROUP BY `rh`.`id_cliente`;


CREATE PROCEDURE `inicio_sesion` (id_user int , valor_token varchar(145))
BEGIN
	declare id_gen int;
	insert into tokens_user(`id_user`,`token`) values (id_user,valor_token);
    set id_gen = LAST_INSERT_ID();
    select  u.nombre,u.apellido,u.dni,t.id_token from usuarios_clientes u,tokens_user t where t.id_token = id_gen;
END$$


DELIMITER $$
USE `bd_hotel2`$$
CREATE PROCEDURE `inicio_sesion_adm` (correo_d varchar(245),contra_d varchar(145),tokem varchar(145))
BEGIN
	declare id_usuario,id_tokem integer;
    set id_usuario = (SELECT id from administradores where correo = correo_d and contra = contra_d);
    
    if id_usuario != '' then
		Insert into tokens_user(id_user,token) values (id_usuario,tokem);
        set id_tokem = last_insert_id();
        select u.id,u.correo,u.nombre,id_tokem as id_tokem,tokem as tokem from administradores u where id = id_usuario;  
    end if;
END$$

DELIMITER ;


DELIMITER $$
USE `bd_hotel2`$$
CREATE PROCEDURE `reporte` (fecha_aux date)
BEGIN
	declare habitaciones,reporte,usuario int default 0;
    set habitaciones = (SELECT suma_users from reporte_habitaciones_dias where date(fecha) = fecha_aux);
    set reporte = (SELECT suma_datos from reporte_reclamos_dias where date(fecha) = fecha_aux);
    set usuario = (SELECT suma_users from reporte_usuarios_dias where date(fecha) = fecha_aux);
    select habitaciones,reporte,usuario;
END$$

DELIMITER ;

DELIMITER $$
USE `bd_hotel2`$$
CREATE PROCEDURE `suma_reporte_urh`(mes varchar(4))
BEGIN
	declare cant_h,cant_clientes,cant_reclamos integer;
	set cant_h = (SELECT count(id_habitacion) FROM registro_habitaciones  where month(fecha_reservacion) = mes );
    set cant_clientes = (SELECT count(id_user) as cant FROM usuarios_clientes where month(fecha_creacion) = mes);
    set cant_reclamos = (select count(id) from reclamos where month(fecha) = "11");
	select cant_h as total_habitacion,cant_clientes as total_clientes ,cant_reclamos as total_reclamos;
END$$

DELIMITER ;


DELIMITER $$
USE `bd_hotel2`$$
CREATE PROCEDURE `suma_reporte_usuarios` ()
BEGIN
	select sum(h.suma_users) as habitaciones , sum(u.suma_users) as usuarios,sum(r.suma_datos) as reclamos from reporte_habitaciones_dias h, 
	reporte_reclamos_dias r, reporte_usuarios_dias u ;
END$$

DELIMITER ;

DELIMITER $$
USE `bd_hotel2`$$
CREATE PROCEDURE `VENTAS_DIARIAS_HORA`(FECHA_DATE DATE)
BEGIN
	select hour(fecha_reservacion) as hora,count(*) as fechas from registro_habitaciones where DATE(fecha_reservacion) = FECHA_DATE group by hour(fecha_reservacion) order by fechas; 
END$$

DELIMITER ;

