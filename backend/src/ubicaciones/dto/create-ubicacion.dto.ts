export class CreateUbicacionDto {
  nombre!: string;
  calle!: string;
  num_ext!: string;
  num_int?: string;
  colonia!: string;
  codigo_postal!: string;
  municipio!: string;
}
