/**
 * Declarative Query Use Cases for Contact
 * Generated from queries: block in entity YAML — do not edit directly.
 *
 * Each query is an injectable use case class that delegates to the service.
 * Register all via `declarativeQueryClasses` in the module providers.
 */

import { Injectable } from '@nestjs/common';
import { ContactService } from '../contact.service';
import type { Contact } from '../contact.entity';

@Injectable()
export class FindContactByUserIdUseCase {
  constructor(private readonly service: ContactService) {}

  async execute(userId: string): Promise<Contact[]> {
    return this.service.findByUserId(userId);
  }
}

@Injectable()
export class FindContactByAccountIdUseCase {
  constructor(private readonly service: ContactService) {}

  async execute(accountId: string): Promise<Contact[]> {
    return this.service.findByAccountId(accountId);
  }
}

@Injectable()
export class FindContactByExternalIdUseCase {
  constructor(private readonly service: ContactService) {}

  async execute(externalId: string): Promise<Contact | null> {
    return this.service.findByExternalId(externalId);
  }
}

export const declarativeQueryClasses = [
  FindContactByUserIdUseCase,
  FindContactByAccountIdUseCase,
  FindContactByExternalIdUseCase,
];
