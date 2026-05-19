import { Injectable, Inject } from "@nestjs/common";
import { ITenantRepository, TenantRepositoryToken } from "src/domain/tenants/repositories/tenant.repository";
import { TenantSlug } from "src/domain/tenants/value-objects/tenant-slug.vo";

@Injectable()
export class TenantSlugGeneratorService {
  constructor(
    @Inject(TenantRepositoryToken)
    private readonly tenantRepo: ITenantRepository
  ) {}

  /**
   * Derives a URL-safe slug from the given name and ensures uniqueness by
   * appending a numeric suffix on collision (e.g. "acme-corp" → "acme-corp-2").
   */
  async generateUnique(name: string): Promise<TenantSlug> {
    const base = this.toSlugBase(name);
    let candidate = base;
    let suffix = 2;

    while (await this.tenantRepo.existsBySlug(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix++;
    }

    return new TenantSlug(candidate);
  }

  private toSlugBase(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 90);
  }
}
