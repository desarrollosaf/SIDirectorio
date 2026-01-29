import { Test, TestingModule } from '@nestjs/testing';
import { ExtensionesService } from './extensiones.service';

describe('ExtensionesService', () => {
  let service: ExtensionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExtensionesService],
    }).compile();

    service = module.get<ExtensionesService>(ExtensionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
