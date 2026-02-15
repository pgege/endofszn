import { IsString, IsOptional } from 'class-validator';

export class CreateWorkflowRunDto {
  @IsString()
  vendorId: string;

  @IsOptional()
  @IsString()
  workflowId?: string;
}
