import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryBookingsDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit: number = 10;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  eventId?: number;

  @IsOptional()
  @IsEnum(['PENDING', 'CONFIRMED', 'FAILED'])
  status?: string;
}
