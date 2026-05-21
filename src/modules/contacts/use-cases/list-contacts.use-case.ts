import { Injectable } from '@nestjs/common';
import { ContactService } from '../contact.service';
import type { Contact } from '../contact.entity';

@Injectable()
export class ListContactsUseCase {
  constructor(private readonly service: ContactService) {}

  async execute(): Promise<Contact[]> {
    return this.service.list();
  }
}
