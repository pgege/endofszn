import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { AuthToken, ApiException } from '../common';

@Controller('api/workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  private requireAuth(token: string | undefined): string {
    if (!token) throw ApiException.unauthorized('Not authenticated');
    return token;
  }

  @Post()
  create(@AuthToken() token: string | undefined, @Body() dto: CreateWorkflowDto) {
    this.requireAuth(token);
    return this.workflowsService.create(dto);
  }

  @Get()
  findAll(@AuthToken() token: string | undefined, @Query('vendorId') vendorId: string) {
    this.requireAuth(token);
    return this.workflowsService.findAllByVendor(vendorId);
  }

  @Get(':id')
  findOne(@AuthToken() token: string | undefined, @Param('id') id: string) {
    this.requireAuth(token);
    return this.workflowsService.findOne(id);
  }

  @Put(':id')
  update(@AuthToken() token: string | undefined, @Param('id') id: string, @Body() dto: UpdateWorkflowDto) {
    this.requireAuth(token);
    return this.workflowsService.update(id, dto);
  }

  @Delete(':id')
  delete(@AuthToken() token: string | undefined, @Param('id') id: string) {
    this.requireAuth(token);
    return this.workflowsService.delete(id);
  }
}
