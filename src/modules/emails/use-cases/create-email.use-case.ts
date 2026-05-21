import { Injectable } from '@nestjs/common';
import { EmailService } from '../email.service';
import type { CreateEmailDto } from '../dto/create-email.dto';
import type { Email } from '../email.entity';

@Injectable()
export class CreateEmailUseCase {
  constructor(private readonly service: EmailService) {}

  async execute(
    dto: CreateEmailDto,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<Email> {
    return this.service.create(dto);
  }
}
