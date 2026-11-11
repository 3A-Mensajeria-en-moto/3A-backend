import { Controller, Get, Query } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { Roles } from '../common/decoradores';
import { Rol } from '../usuarios/rol';
import { CadetesService } from './cadetes.service';

export class ListarCadetesQuery {
  /** true (por defecto): solo cadetes activos. */
  @IsOptional()
  @Transform(({ obj, key }) => {
    const v = obj[key];
    return v === 'true' || v === true ? true : v === 'false' || v === false ? false : v;
  })
  @IsBoolean()
  activo: boolean = true;
}

@Controller('cadetes')
export class CadetesController {
  constructor(private readonly cadetes: CadetesService) {}

  @Get()
  @Roles(Rol.OPERADOR)
  listar(@Query() query: ListarCadetesQuery) {
    return this.cadetes.listar(query.activo);
  }
}
