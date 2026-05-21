import { Injectable, NotFoundException } from '@nestjs/common';
import { OpportunityService } from '../opportunity.service';
import type { Opportunity } from '../opportunity.entity';

@Injectable()
export class FindOpportunityByIdUseCase {
  constructor(private readonly service: OpportunityService) {}

  async execute(id: string): Promise<Opportunity> {
    const entity = await this.service.findById(id);
    if (entity === null || entity === undefined) {
      throw new NotFoundException(`Opportunity not found: ${id}`);
    }
    return entity;
  }
}
