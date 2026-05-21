import { Injectable } from '@nestjs/common';
import { OpportunityService } from '../opportunity.service';

@Injectable()
export class DeleteOpportunityUseCase {
  constructor(private readonly service: OpportunityService) {}

  async execute(
    id: string,
    _opts?: { actor?: { tenantId?: string | null; userId?: string } },
  ): Promise<void> {
    return this.service.delete(id);
  }
}
