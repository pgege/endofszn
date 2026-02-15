import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { MedusaService } from '../medusa/medusa.service';
import { StoreSyncService, MutationEvent } from '../events/store-sync.service';
import { WorkflowRunsService } from '../workflow-runs';
import { ChatUploadsService } from '../chat-uploads';
import { ApiException, MedusaException } from '../common';

type Source = 'user' | 'agent';
type Entity = MutationEvent['entity'];
type Action = MutationEvent['action'];

@Injectable()
export class CatalogService {
  constructor(
    private readonly medusa: MedusaService,
    private readonly storeSync: StoreSyncService,
    private readonly workflowRuns: WorkflowRunsService,
    private readonly chatUploads: ChatUploadsService,
  ) {}

  private broadcast(vendorId: string, storeId: string, entity: Entity, action: Action, source: Source, entityId?: string, entityIds?: string[], data?: any) {
    this.storeSync.broadcastMutation({
      vendor_id: vendorId,
      store_id: storeId,
      entity,
      action,
      entity_id: entityId,
      entity_ids: entityIds,
      data,
      timestamp: new Date().toISOString(),
      source,
    });
  }

  async getProducts(token: string, storeId: string, params?: { limit?: number; offset?: number; q?: string; id?: string[]; status?: string[]; category_id?: string[]; order?: string; fields?: string }) {
    try {
      return await this.medusa.getProducts(token, storeId, params);
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'getProducts', storeId });
    }
  }

  async createProducts(token: string, vendorId: string, storeId: string, items: any[], source: Source) {
    try {
      const result = await this.medusa.createProducts(token, storeId, items);
      const createdIds = result.products?.map((p: any) => p.id) || [];
      this.broadcast(vendorId, storeId, 'product', 'created', source, undefined, createdIds);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'createProducts', storeId });
    }
  }

  async updateProducts(token: string, vendorId: string, storeId: string, updates: any[], source: Source) {
    try {
      const result = await this.medusa.updateProducts(token, storeId, updates);
      const updatedIds = updates.map((u: any) => u.id).filter(Boolean);
      this.broadcast(vendorId, storeId, 'product', 'updated', source, undefined, updatedIds);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'updateProducts', storeId });
    }
  }

  async deleteProducts(token: string, vendorId: string, storeId: string, ids: string[], source: Source) {
    try {
      const result = await this.medusa.deleteProducts(token, storeId, ids);
      this.broadcast(vendorId, storeId, 'product', 'deleted', source, undefined, ids);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'deleteProducts', storeId });
    }
  }

  async getCategories(token: string, storeId: string, params?: { limit?: number; offset?: number; q?: string; order?: string; id?: string[] }) {
    try {
      return await this.medusa.getCategories(token, storeId, params);
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'getCategories', storeId });
    }
  }

  async createCategories(token: string, vendorId: string, storeId: string, items: any[], source: Source) {
    try {
      const result = await this.medusa.createCategories(token, storeId, items);
      const createdIds = result.categories?.map((c: any) => c.id) || [];
      this.broadcast(vendorId, storeId, 'category', 'created', source, undefined, createdIds);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'createCategories', storeId });
    }
  }

  async updateCategories(token: string, vendorId: string, storeId: string, updates: any[], source: Source) {
    try {
      const result = await this.medusa.updateCategories(token, storeId, updates);
      const updatedIds = updates.map((u: any) => u.id).filter(Boolean);
      this.broadcast(vendorId, storeId, 'category', 'updated', source, undefined, updatedIds);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'updateCategories', storeId });
    }
  }

  async deleteCategories(token: string, vendorId: string, storeId: string, ids: string[], source: Source) {
    try {
      const result = await this.medusa.deleteCategories(token, storeId, ids);
      this.broadcast(vendorId, storeId, 'category', 'deleted', source, undefined, ids);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'deleteCategories', storeId });
    }
  }

  async getCategoryTemplates(token: string, storeId: string, params?: any) {
    try {
      return await this.medusa.getCategoryTemplates(token, storeId, params);
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'getCategoryTemplates', storeId });
    }
  }

  async applyCategoryTemplate(token: string, vendorId: string, storeId: string, data: { template_id: string }, source: Source) {
    try {
      const result = await this.medusa.applyCategoryTemplate(token, storeId, data);
      this.broadcast(vendorId, storeId, 'category', 'bulk_updated', source, undefined, result.categories?.map((cat: any) => cat.id), result);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'applyCategoryTemplate', storeId });
    }
  }

  async getUncategorizedProducts(token: string, storeId: string, params?: any) {
    try {
      return await this.medusa.getUncategorizedProducts(token, storeId, params);
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'getUncategorizedProducts', storeId });
    }
  }

  async bulkCategorize(token: string, vendorId: string, storeId: string, data: { assignments: Array<{ product_id: string; category_ids: string[] }> }, source: Source) {
    try {
      const result = await this.medusa.bulkCategorize(token, storeId, data);
      this.broadcast(vendorId, storeId, 'product', 'bulk_updated', source, undefined, data.assignments.map((a) => a.product_id), result);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'bulkCategorize', storeId });
    }
  }

  async createVariants(token: string, vendorId: string, storeId: string, productId: string, variants: any[], source: Source) {
    try {
      const result = await this.medusa.createVariants(token, storeId, productId, variants);
      const variantIds = result.variants?.map((v: any) => v.id) || [];
      this.broadcast(vendorId, storeId, 'variant', 'created', source, productId, variantIds, result);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'createVariants', storeId, productId });
    }
  }

  async updateVariants(token: string, vendorId: string, storeId: string, productId: string, updates: any[], source: Source) {
    try {
      const result = await this.medusa.updateVariants(token, storeId, productId, updates);
      this.broadcast(vendorId, storeId, 'variant', 'updated', source, undefined, updates.map((u: any) => u.id), result);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'updateVariants', storeId, productId });
    }
  }

  async deleteVariants(token: string, vendorId: string, storeId: string, productId: string, variantIds: string[], source: Source) {
    try {
      const result = await this.medusa.deleteVariants(token, storeId, productId, variantIds);
      this.broadcast(vendorId, storeId, 'variant', 'deleted', source, undefined, variantIds, result);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'deleteVariants', storeId, productId });
    }
  }

  async updateProductOptions(token: string, vendorId: string, storeId: string, productId: string, updates: any[], source: Source) {
    try {
      const result = await this.medusa.updateProductOptions(token, storeId, productId, updates);
      this.broadcast(vendorId, storeId, 'product_option', 'updated', source, undefined, updates.map((u: any) => u.id), result);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'updateProductOptions', storeId, productId });
    }
  }

  async uploadFiles(token: string, files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>) {
    try {
      return await this.medusa.uploadFiles(token, files);
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'uploadFiles' });
    }
  }

  async uploadProductImages(token: string, vendorId: string, storeId: string, productId: string, imageEntries: Array<{ attachment_id: string; variant_ids?: string[] }>, source: Source) {
    try {
      if (!imageEntries || imageEntries.length === 0) {
        throw new Error('No images provided');
      }

      const attachmentIds = imageEntries.map((e) => e.attachment_id);
      const attachments = await this.workflowRuns.getAttachmentsByIds(attachmentIds);
      const filesToUpload: Array<{ buffer: Buffer; originalname: string; mimetype: string }> = [];
      const uploadMeta: Array<{ attachment_id: string; filename: string; variant_ids: string[] }> = [];

      for (const entry of imageEntries) {
        const att = attachments.find((a) => a.id === entry.attachment_id);
        if (!att) throw new Error(`Attachment not found: ${entry.attachment_id}`);

        const uploadId = att.url.replace('/api/chat-uploads/', '');
        const filePath = this.chatUploads.getFilePath(uploadId);
        if (!filePath) throw new Error(`File not found for attachment: ${entry.attachment_id}`);

        const buffer = await fs.promises.readFile(filePath);
        let mimetype = att.mimeType || '';
        if (!mimetype || mimetype === 'application/octet-stream') {
          const ext = att.filename.split('.').pop()?.toLowerCase();
          const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif' };
          mimetype = mimeMap[ext || ''] || 'application/octet-stream';
        }

        filesToUpload.push({ buffer, originalname: att.filename, mimetype });
        uploadMeta.push({ attachment_id: entry.attachment_id, filename: att.filename, variant_ids: entry.variant_ids || [] });
      }

      const uploaded = await this.medusa.uploadFiles(token, filesToUpload);
      const permanentUrls = uploaded.files.map((f) => f.url);

      const urlToMeta = new Map<string, (typeof uploadMeta)[number]>();
      for (let i = 0; i < permanentUrls.length; i++) {
        urlToMeta.set(permanentUrls[i], uploadMeta[i]);
      }

      const addResult = await this.medusa.addProductImages(token, storeId, productId, permanentUrls);
      const resultImages: Array<{ id: string; attachment_id: string; filename: string; assigned_variants: string[] }> = [];

      for (const img of addResult.images) {
        const meta = urlToMeta.get(img.url);
        const variantIds = meta?.variant_ids || [];
        if (variantIds.length > 0) {
          for (const variantId of variantIds) {
            await this.medusa.updateVariantImages(token, storeId, productId, variantId, { add: [img.id] });
          }
        }
        resultImages.push({ id: img.id, attachment_id: meta?.attachment_id || '', filename: meta?.filename || '', assigned_variants: variantIds });
      }

      const imageIds = resultImages.map((img: any) => img.id).filter(Boolean);
      this.broadcast(vendorId, storeId, 'product', 'updated', source, productId, imageIds, addResult);
      return { images: resultImages };
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'uploadProductImages', storeId, productId });
    }
  }

  async deleteProductImages(token: string, vendorId: string, storeId: string, productId: string, imageIds: string[], source: Source) {
    try {
      const result = await this.medusa.deleteProductImages(token, storeId, productId, imageIds);
      this.broadcast(vendorId, storeId, 'product', 'updated', source, productId, imageIds, result);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'deleteProductImages', storeId, productId });
    }
  }

  async updateVariantImages(token: string, vendorId: string, storeId: string, productId: string, variantId: string, data: { add?: string[]; remove?: string[] }, source: Source) {
    try {
      const result = await this.medusa.updateVariantImages(token, storeId, productId, variantId, data);
      this.broadcast(vendorId, storeId, 'variant', 'updated', source, variantId, [variantId], result);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'updateVariantImages', storeId, productId, variantId });
    }
  }

  async bulkUpdateVariantImages(token: string, vendorId: string, storeId: string, productId: string, assign: Array<{ image_id: string; variant_ids: string[] }>, unassign: Array<{ image_id: string; variant_ids: string[] }>, source: Source) {
    try {
      const variantAdds = new Map<string, string[]>();
      const variantRemoves = new Map<string, string[]>();

      for (const entry of assign) {
        for (const vid of entry.variant_ids) {
          if (!variantAdds.has(vid)) variantAdds.set(vid, []);
          variantAdds.get(vid)!.push(entry.image_id);
        }
      }

      for (const entry of unassign) {
        for (const vid of entry.variant_ids) {
          if (!variantRemoves.has(vid)) variantRemoves.set(vid, []);
          variantRemoves.get(vid)!.push(entry.image_id);
        }
      }

      const allVariantIds = [...new Set([...variantAdds.keys(), ...variantRemoves.keys()])];

      await Promise.all(allVariantIds.map(async (vid) => {
        const add = variantAdds.get(vid);
        const remove = variantRemoves.get(vid);
        await this.medusa.updateVariantImages(token, storeId, productId, vid, { add, remove });
      }));
      this.broadcast(vendorId, storeId, 'variant', 'updated', source, undefined, allVariantIds);

      return { assigned: assign, unassigned: unassign };
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'bulkUpdateVariantImages', storeId, productId });
    }
  }
}
