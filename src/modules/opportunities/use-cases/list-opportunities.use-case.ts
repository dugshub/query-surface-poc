import { Injectable } from '@nestjs/common';
import { OpportunityService } from '../opportunity.service';
import type { Opportunity } from '../opportunity.entity';

@Injectable()
export class ListOpportunitiesUseCase {
  constructor(private readonly service: OpportunityService) {}

  async execute(): Promise<Opportunity[]> {
    return this.service.list();
  }
}
