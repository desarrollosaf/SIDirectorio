import { PartialType } from '@nestjs/mapped-types';
import { CreateExtensioneDto } from './create-extensione.dto';

export class UpdateExtensioneDto extends PartialType(CreateExtensioneDto) {}
