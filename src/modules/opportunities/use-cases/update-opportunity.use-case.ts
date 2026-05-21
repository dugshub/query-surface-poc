import { Injectable } from '@nestjs/common';
import { OpportunityService } from '../opportunity.service';
import type { UpdateOpportunityDto } from '../dto/update-opportunity.dto';
import type { Opportunity } from '../opportunity.entity';

@Injectable()
export class UpdateOpportunityUseCase {
  constructor(private readonly service: OpportunityService) {}

  async execute(
    id: string,
    dto: UpdateOpportunityDto,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<Opportunity | null> {
    return this.service.update(id, dto);
  }
}
