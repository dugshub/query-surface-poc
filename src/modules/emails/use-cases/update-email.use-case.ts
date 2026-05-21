import { Injectable } from '@nestjs/common';
import { EmailService } from '../email.service';
import type { UpdateEmailDto } from '../dto/update-email.dto';
import type { Email } from '../email.entity';

@Injectable()
export class UpdateEmailUseCase {
  constructor(private readonly service: EmailService) {}

  async execute(
    id: string,
    dto: UpdateEmailDto,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<Email | null> {
    return this.service.update(id, dto);
  }
}
