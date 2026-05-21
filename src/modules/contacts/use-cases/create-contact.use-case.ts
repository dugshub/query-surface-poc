import { Injectable } from '@nestjs/common';
import { ContactService } from '../contact.service';
import type { CreateContactDto } from '../dto/create-contact.dto';
import type { Contact } from '../contact.entity';

@Injectable()
export class CreateContactUseCase {
  constructor(private readonly service: ContactService) {}

  async execute(
    dto: CreateContactDto,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<Contact> {
    return this.service.create(dto);
  }
}
