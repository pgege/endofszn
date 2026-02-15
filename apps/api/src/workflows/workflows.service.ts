import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkflowDto) {
    try {
      return await this.prisma.workflow.create({
        data: {
          vendorId: dto.vendorId,
          name: dto.name,
          description: dto.description,
          definition: dto.definition as Prisma.InputJsonValue,
        },
      });
    } catch (error: any) {
      throw ApiException.internal(`Failed to create workflow: ${error.message}`, { operation: 'create_workflow' });
    }
  }

  async findAllByVendor(vendorId: string) {
    try {
      return await this.prisma.workflow.findMany({
        where: {
          OR: [{ vendorId }, { vendorId: '__global__' }],
        },
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error: any) {
      throw ApiException.internal(`Failed to list workflows: ${error.message}`, { operation: 'list_workflows', vendorId });
    }
  }

  async findOne(id: string) {
    try {
      const workflow = await this.prisma.workflow.findUnique({
        where: { id },
      });

      if (!workflow) {
        throw ApiException.notFound(`Workflow ${id} not found`);
      }

      return workflow;
    } catch (error: any) {
      if (error instanceof ApiException) throw error;
      throw ApiException.internal(`Failed to get workflow: ${error.message}`, { operation: 'get_workflow', id });
    }
  }

  async update(id: string, dto: UpdateWorkflowDto) {
    try {
      const workflow = await this.prisma.workflow.findUnique({
        where: { id },
      });

      if (!workflow) {
        throw ApiException.notFound(`Workflow ${id} not found`);
      }

      return await this.prisma.workflow.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.definition !== undefined && {
            definition: dto.definition as Prisma.InputJsonValue,
          }),
        },
      });
    } catch (error: any) {
      if (error instanceof ApiException) throw error;
      throw ApiException.internal(`Failed to update workflow: ${error.message}`, { operation: 'update_workflow', id });
    }
  }

  async delete(id: string) {
    try {
      const workflow = await this.prisma.workflow.findUnique({
        where: { id },
      });

      if (!workflow) {
        throw ApiException.notFound(`Workflow ${id} not found`);
      }

      await this.prisma.workflow.delete({ where: { id } });
      return { deleted: true };
    } catch (error: any) {
      if (error instanceof ApiException) throw error;
      throw ApiException.internal(`Failed to delete workflow: ${error.message}`, { operation: 'delete_workflow', id });
    }
  }
}
