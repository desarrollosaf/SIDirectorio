import { Test, TestingModule } from '@nestjs/testing';
import { DependenciasService } from './dependencias.service';

describe('DependenciasService', () => {
  let service: DependenciasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DependenciasService],
    }).compile();

    service = module.get<DependenciasService>(DependenciasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
