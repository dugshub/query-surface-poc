import { Injectable } from '@nestjs/common';
import { EmailService } from '../email.service';
import type { Email } from '../email.entity';

@Injectable()
export class ListEmailsUseCase {
  constructor(private readonly service: EmailService) {}

  async execute(): Promise<Email[]> {
    return this.service.list();
  }
}
