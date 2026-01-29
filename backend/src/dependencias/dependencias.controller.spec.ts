import { Test, TestingModule } from '@nestjs/testing';
import { DependenciasController } from './dependencias.controller';
import { DependenciasService } from './dependencias.service';

describe('DependenciasController', () => {
  let controller: DependenciasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DependenciasController],
      providers: [DependenciasService],
    }).compile();

    controller = module.get<DependenciasController>(DependenciasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
