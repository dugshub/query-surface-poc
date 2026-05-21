import { Injectable } from '@nestjs/common';
import { OpportunityService } from '../opportunity.service';
import type { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import type { Opportunity } from '../opportunity.entity';

@Injectable()
export class CreateOpportunityUseCase {
  constructor(private readonly service: OpportunityService) {}

  async execute(
    dto: CreateOpportunityDto,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<Opportunity> {
    return this.service.create(dto);
  }
}
