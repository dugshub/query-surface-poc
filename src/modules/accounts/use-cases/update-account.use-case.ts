import { Injectable } from '@nestjs/common';
import { AccountService } from '../account.service';
import type { UpdateAccountDto } from '../dto/update-account.dto';
import type { Account } from '../account.entity';

@Injectable()
export class UpdateAccountUseCase {
  constructor(private readonly service: AccountService) {}

  async execute(
    id: string,
    dto: UpdateAccountDto,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<Account | null> {
    return this.service.update(id, dto);
  }
}
