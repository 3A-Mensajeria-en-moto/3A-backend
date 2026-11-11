/**
 * Alta de usuarios desde la terminal (el contrato no tiene endpoint de alta).
 *
 *   npm run build
 *   npm run usuario:crear -- --nombre "Juan Pérez" --email juan@x.com --password secreto123 --rol CADETE [--telefono "+54 11 ..."]
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Rol } from '../usuarios/rol';
import { UsuariosService } from '../usuarios/usuarios.service';

function args(): Record<string, string> {
  const salida: Record<string, string> = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) salida[a[i].replace(/^--/, '')] = a[i + 1];
  return salida;
}

async function main() {
  const { nombre, email, password, rol, telefono } = args();
  if (!nombre || !email || !password || !rol) {
    console.error('Uso: --nombre <n> --email <e> --password <min 8> --rol CLIENTE|OPERADOR|CADETE [--telefono <t>]');
    process.exit(1);
  }
  if (!Object.values(Rol).includes(rol as Rol)) {
    console.error(`Rol inválido: ${rol}`);
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const usuarios = app.get(UsuariosService);
  if (await usuarios.buscarPorEmail(email)) {
    console.error(`Ya existe un usuario con el email ${email}.`);
    await app.close();
    process.exit(1);
  }
  const u = await usuarios.crear({ nombre, email, password, rol: rol as Rol, telefono });
  console.log(`Usuario creado: #${u.id} ${u.nombre} <${u.email}> (${u.rol})`);
  await app.close();
}
main();
