import { Injectable } from '@nestjs/common';
import { AccountService } from '../account.service';
import type { Account } from '../account.entity';

@Injectable()
export class ListAccountsUseCase {
  constructor(private readonly service: AccountService) {}

  async execute(): Promise<Account[]> {
    return this.service.list();
  }
}
