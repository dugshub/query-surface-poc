import { Injectable, NotFoundException } from '@nestjs/common';
import { EmailService } from '../email.service';
import type { Email } from '../email.entity';

@Injectable()
export class FindEmailByIdUseCase {
  constructor(private readonly service: EmailService) {}

  async execute(id: string): Promise<Email> {
    const entity = await this.service.findById(id);
    if (entity === null || entity === undefined) {
      throw new NotFoundException(`Email not found: ${id}`);
    }
    return entity;
  }
}
