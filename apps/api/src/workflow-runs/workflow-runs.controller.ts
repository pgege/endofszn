import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { WorkflowRunsService } from './workflow-runs.service';
import { CreateWorkflowRunDto } from './dto';
import { AuthToken, ApiException } from '../common';

@Controller('api/workflow-runs')
export class WorkflowRunsController {
  constructor(private readonly workflowRunsService: WorkflowRunsService) {}

  private requireAuth(token: string | undefined): string {
    if (!token) throw ApiException.unauthorized('Not authenticated');
    return token;
  }

  @Post()
  create(@AuthToken() token: string | undefined, @Body() dto: CreateWorkflowRunDto) {
    this.requireAuth(token);
    return this.workflowRunsService.create(dto);
  }

  @Get()
  findAll(
    @AuthToken() token: string | undefined,
    @Query('vendorId') vendorId: string,
    @Query('workflowId') workflowId?: string,
  ) {
    this.requireAuth(token);
    return this.workflowRunsService.findAllByVendor(vendorId, workflowId);
  }

  @Get(':id')
  findOne(@AuthToken() token: string | undefined, @Param('id') id: string) {
    this.requireAuth(token);
    return this.workflowRunsService.findOne(id);
  }

  @Patch(':id/title')
  updateTitle(@AuthToken() token: string | undefined, @Param('id') id: string, @Body('title') title: string) {
    this.requireAuth(token);
    return this.workflowRunsService.updateTitle(id, title);
  }

  @Delete(':id')
  delete(@AuthToken() token: string | undefined, @Param('id') id: string) {
    this.requireAuth(token);
    return this.workflowRunsService.delete(id);
  }
}
