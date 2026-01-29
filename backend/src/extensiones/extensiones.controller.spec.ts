import { Test, TestingModule } from '@nestjs/testing';
import { ExtensionesController } from './extensiones.controller';
import { ExtensionesService } from './extensiones.service';

describe('ExtensionesController', () => {
  let controller: ExtensionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExtensionesController],
      providers: [ExtensionesService],
    }).compile();

    controller = module.get<ExtensionesController>(ExtensionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
