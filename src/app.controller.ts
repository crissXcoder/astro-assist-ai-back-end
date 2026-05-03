import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/decorators/public.decorator.js';
import { AppService } from './app.service.js';

@Controller()
@Public()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
