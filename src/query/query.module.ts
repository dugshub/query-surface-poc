// QueryModule — wires the search + fetch controllers.

import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { FetchController } from './fetch.controller';

@Module({
  controllers: [SearchController, FetchController],
})
export class QueryModule {}
