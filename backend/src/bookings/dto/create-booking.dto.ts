import { IsInt, IsString, IsEmail, IsNotEmpty, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @IsInt()
  @Min(1)
  eventId: number;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsInt()
  @Min(1)
  seats: number;
}
