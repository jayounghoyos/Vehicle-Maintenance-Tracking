import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Vehicle, VehicleModel, VehiclePhoto } from '../entities';
import { PhotoStorage } from '../photos/photo-storage.service';
import { TenantRepositories } from '../tenant/tenant-repository';
import { VehiclesService } from './vehicles.service';

const ORG = 10;
const VEHICLE_ID = 1;

describe('VehiclesService gallery', () => {
  let service: VehiclesService;
  let vehicle: { id: number; organizationId: number; photoKey: string | null };
  let gallery: { id: number; vehicleId: number; storageKey: string; position: number }[];
  let photos: { upload: jest.Mock; remove: jest.Mock; url: jest.Mock };

  beforeEach(async () => {
    vehicle = { id: VEHICLE_ID, organizationId: ORG, photoKey: 'main-key' };
    gallery = [];

    photos = {
      upload: jest
        .fn()
        .mockImplementation(() => Promise.resolve(`key-${gallery.length}`)),
      remove: jest.fn().mockResolvedValue(undefined),
      url: jest.fn((key: string | null) => (key ? `https://cdn/${key}` : null)),
    };

    const galleryRepo = {
      count: jest.fn(() => Promise.resolve(gallery.length)),
      find: jest.fn(() => Promise.resolve([...gallery])),
      findOne: jest.fn(({ where }: { where: { id: number } }) =>
        Promise.resolve(gallery.find((photo) => photo.id === where.id) ?? null),
      ),
      create: jest.fn((data: Record<string, unknown>) => ({
        id: gallery.length + 1,
        ...data,
      })),
      save: jest.fn((photo: (typeof gallery)[number]) => {
        if (!gallery.includes(photo)) gallery.push(photo);
        return Promise.resolve(photo);
      }),
      delete: jest.fn(({ id }: { id: number }) => {
        gallery = gallery.filter((photo) => photo.id !== id);
        return Promise.resolve(1);
      }),
    };

    const tenants = {
      for: jest.fn((entity) => {
        if (entity === VehiclePhoto) return galleryRepo;
        if (entity === Vehicle) {
          return {
            find: jest.fn(() =>
              Promise.resolve([{ ...vehicle, model: { make: 'A', name: 'B' } }]),
            ),
            findOne: jest.fn(() => Promise.resolve(vehicle)),
            save: jest.fn((v: typeof vehicle) =>
              Promise.resolve(Object.assign(vehicle, v)),
            ),
            count: jest.fn().mockResolvedValue(0),
            builder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([]),
            }),
          };
        }
        return {
          find: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
          builder: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([]),
          }),
        };
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: TenantRepositories, useValue: tenants },
        { provide: PhotoStorage, useValue: photos },
        { provide: getRepositoryToken(VehicleModel), useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(VehiclesService);
  });

  it('refuses to go past the ceiling instead of billing for it', async () => {
    gallery = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      vehicleId: VEHICLE_ID,
      storageKey: `key-${i}`,
      position: i,
    }));

    await expect(
      service.addPhotos(ORG, VEHICLE_ID, 1, [Buffer.from('x')]),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(photos.upload).not.toHaveBeenCalled();
  });

  it('promoting swaps, so the old main picture is kept', async () => {
    gallery = [{ id: 7, vehicleId: VEHICLE_ID, storageKey: 'side-view', position: 0 }];

    await service.promotePhoto(ORG, VEHICLE_ID, 7);

    expect(vehicle.photoKey).toBe('side-view');
    expect(gallery[0].storageKey).toBe('main-key');
    expect(photos.remove).not.toHaveBeenCalled();
  });

  it('deletes the row before the file, so nothing points at a missing image', async () => {
    gallery = [{ id: 7, vehicleId: VEHICLE_ID, storageKey: 'gone', position: 0 }];

    await service.removeGalleryPhoto(ORG, VEHICLE_ID, 7);

    expect(gallery).toHaveLength(0);
    expect(photos.remove).toHaveBeenCalledWith('gone');
  });
});
