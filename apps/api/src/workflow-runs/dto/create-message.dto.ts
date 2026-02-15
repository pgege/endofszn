import { IsString, IsOptional, IsObject, IsIn } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsIn(['user', 'assistant', 'system'])
  role: string;

  @IsString()
  type: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
