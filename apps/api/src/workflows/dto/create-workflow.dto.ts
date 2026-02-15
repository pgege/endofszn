import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateWorkflowDto {
  @IsString()
  vendorId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  definition: Record<string, unknown>;
}
