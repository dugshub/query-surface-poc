import { Injectable } from '@nestjs/common';
import { AccountService } from '../account.service';

@Injectable()
export class DeleteAccountUseCase {
  constructor(private readonly service: AccountService) {}

  async execute(
    id: string,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<void> {
    return this.service.delete(id);
  }
}
