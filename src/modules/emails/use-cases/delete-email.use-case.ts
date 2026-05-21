import { Injectable } from '@nestjs/common';
import { EmailService } from '../email.service';

@Injectable()
export class DeleteEmailUseCase {
  constructor(private readonly service: EmailService) {}

  async execute(
    id: string,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<void> {
    return this.service.delete(id);
  }
}
