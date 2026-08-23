import {
  DataSource,
  type DeepPartial,
  type EntityTarget,
  type FindManyOptions,
  type FindOneOptions,
  type FindOptionsWhere,
  type ObjectLiteral,
  type Repository,
  type SelectQueryBuilder,
} from 'typeorm';
import { Injectable } from '@nestjs/common';

/** Anything that belongs to one client rather than to the platform. */
export type TenantOwned = ObjectLiteral & { organizationId: number };

/**
 * A repository that cannot be asked about another organization.
 *
 * Scoping used to be a `where` every service had to remember, which
 * works exactly as long as everybody remembers. Here the organization is
 * fixed when the repository is handed over, and it is merged in after
 * the caller's own conditions, so a query that names a different one
 * still comes back scoped rather than crossing into another client.
 *
 * It is deliberately not the whole of TypeORM's Repository: a method
 * that is missing is a method nobody has needed yet, and adding one is
 * the moment to think about whether it can be scoped at all.
 */
export class TenantRepository<T extends TenantOwned> {
  constructor(
    private readonly repository: Repository<T>,
    readonly organizationId: number,
  ) {}

  find(options: FindManyOptions<T> = {}): Promise<T[]> {
    return this.repository.find({ ...options, where: this.scope(options.where) });
  }

  findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne({ ...options, where: this.scope(options.where) });
  }

  count(options: FindManyOptions<T> = {}): Promise<number> {
    return this.repository.count({ ...options, where: this.scope(options.where) });
  }

  /** Stamped with the organization, so a new row cannot be born in
   *  somebody else's. */
  create(data: DeepPartial<T>): T {
    return this.repository.create({
      ...data,
      organizationId: this.organizationId,
    } as DeepPartial<T>);
  }

  createMany(data: DeepPartial<T>[]): T[] {
    return data.map((one) => this.create(one));
  }

  save<E extends DeepPartial<T>>(entity: E): Promise<E & T>;
  save<E extends DeepPartial<T>>(entities: E[]): Promise<(E & T)[]>;
  save(entity: DeepPartial<T> | DeepPartial<T>[]): Promise<unknown> {
    return Array.isArray(entity)
      ? this.repository.save(entity)
      : this.repository.save(entity);
  }

  async update(where: FindOptionsWhere<T>, patch: Partial<T>): Promise<number> {
    const result = await this.repository.update(this.scope(where), patch);
    return result.affected ?? 0;
  }

  async delete(where: FindOptionsWhere<T>): Promise<number> {
    const result = await this.repository.delete(this.scope(where));
    return result.affected ?? 0;
  }

  /** For the aggregate a find cannot express. The organization condition
   *  is already applied, and further conditions must use andWhere. */
  builder(alias: string): SelectQueryBuilder<T> {
    return this.repository
      .createQueryBuilder(alias)
      .where(`${alias}.organization_id = :tenantOrganizationId`, {
        tenantOrganizationId: this.organizationId,
      });
  }

  /** Merged last on purpose: whatever the caller asked for, the
   *  organization is the condition that wins. */
  private scope(
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    const mine = { organizationId: this.organizationId } as FindOptionsWhere<T>;
    if (Array.isArray(where)) return where.map((one) => ({ ...one, ...mine }));
    return { ...(where ?? {}), ...mine };
  }
}

@Injectable()
export class TenantRepositories {
  constructor(private readonly dataSource: DataSource) {}

  /** The organization comes from the token, never from a request body
   *  or a path parameter. */
  for<T extends TenantOwned>(
    entity: EntityTarget<T>,
    organizationId: number,
  ): TenantRepository<T> {
    return new TenantRepository(this.dataSource.getRepository(entity), organizationId);
  }
}
