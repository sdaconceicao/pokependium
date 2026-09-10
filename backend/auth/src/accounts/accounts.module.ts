import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from './accounts.entity';
import { AccountsService } from './accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
