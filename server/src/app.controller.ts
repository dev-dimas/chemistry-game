import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  getHello(): { message: string } {
    return { message: 'Welcome to the Chemistry Game API!' };
  }
}
