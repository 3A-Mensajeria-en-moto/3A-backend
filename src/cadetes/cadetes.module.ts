import { Module } from '@nestjs/common';
import { EnviosModule } from '../envios/envios.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { CadetesController } from './cadetes.controller';
import { CadetesService } from './cadetes.service';

@Module({
  imports: [UsuariosModule, EnviosModule],
  controllers: [CadetesController],
  providers: [CadetesService],
})
export class CadetesModule {}
