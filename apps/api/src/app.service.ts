import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo(): { service: string; status: string } {
    return { service: 'mts-api', status: 'ok' };
  }
}
