import { Injectable } from '@nestjs/common';
import { AccountService } from '../account.service';
import type { CreateAccountDto } from '../dto/create-account.dto';
import type { Account } from '../account.entity';

@Injectable()
export class CreateAccountUseCase {
  constructor(private readonly service: AccountService) {}

  async execute(
    dto: CreateAccountDto,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<Account> {
    return this.service.create(dto);
  }
}
