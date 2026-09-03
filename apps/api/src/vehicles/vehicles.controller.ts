import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  ForbiddenException,
  Get,
  HttpCode,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Principal } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, Requires } from '../auth/guards';
import { Permission } from '../entities';
import { CreateVehicleDto, ImportVehiclesDto, UpdateVehicleDto } from './dto';
import { VehiclesService } from './vehicles.service';
import type { ImportResult, VehicleDetail, VehicleRow } from './vehicles.types';

/* Big enough for a photo straight off a phone, small enough that a
 * mistaken video does not sit in the memory of a free instance. */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
/* Per request. The gallery ceiling itself is the service's to enforce,
   since it has to count what is already there. */
const MAX_GALLERY_UPLOAD = 12;

/**
 * The same split the team screen uses: everybody in the organization can
 * see the fleet they work on, and the coordinator is the one who changes
 * it. The mechanic needs to know which van is in the shop; deciding
 * which vans exist is not their job.
 */
@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  private asUser(principal: Principal) {
    if (principal.kind !== 'user') throw new ForbiddenException('Not a fleet member');
    return principal;
  }

  @Get()
  @Requires(Permission.VIEW_VEHICLES)
  @ApiOperation({ summary: 'Every vehicle in the fleet' })
  list(@CurrentUser() principal: Principal): Promise<VehicleRow[]> {
    return this.vehicles.list(this.asUser(principal).organizationId);
  }

  @Get(':id')
  @Requires(Permission.VIEW_VEHICLES)
  @ApiOperation({ summary: 'One vehicle, with its schedules and recent services' })
  one(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<VehicleDetail> {
    return this.vehicles.one(this.asUser(principal).organizationId, id);
  }

  @Post()
  @Requires(Permission.MANAGE_VEHICLES)
  @ApiOperation({ summary: 'Register a vehicle' })
  create(
    @CurrentUser() principal: Principal,
    @Body() dto: CreateVehicleDto,
  ): Promise<VehicleRow> {
    return this.vehicles.create(this.asUser(principal).organizationId, dto);
  }

  @Post('bulk')
  @Requires(Permission.MANAGE_VEHICLES)
  @ApiOperation({ summary: 'Register many vehicles from a pasted list' })
  importMany(
    @CurrentUser() principal: Principal,
    @Body() dto: ImportVehiclesDto,
  ): Promise<ImportResult> {
    return this.vehicles.importMany(this.asUser(principal).organizationId, dto);
  }

  @Patch(':id')
  @Requires(Permission.MANAGE_VEHICLES)
  @ApiOperation({ summary: 'Correct a vehicle' })
  update(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleDto,
  ): Promise<VehicleRow> {
    return this.vehicles.update(this.asUser(principal).organizationId, id, dto);
  }

  @Post(':id/photo')
  @Requires(Permission.MANAGE_VEHICLES)
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: MAX_PHOTO_BYTES } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Put a picture on a vehicle, replacing any it had' })
  setPhoto(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_PHOTO_BYTES }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    photo: Express.Multer.File,
  ): Promise<VehicleRow> {
    return this.vehicles.setPhoto(
      this.asUser(principal).organizationId,
      id,
      photo.buffer,
    );
  }

  @Post(':id/photos')
  @Requires(Permission.MANAGE_VEHICLES)
  @UseInterceptors(
    FilesInterceptor('photos', MAX_GALLERY_UPLOAD, {
      limits: { fileSize: MAX_PHOTO_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add pictures to a vehicle beyond its main one' })
  addPhotos(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_PHOTO_BYTES }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    photos: Express.Multer.File[],
  ): Promise<VehicleDetail> {
    const user = this.asUser(principal);
    return this.vehicles.addPhotos(
      user.organizationId,
      id,
      user.id,
      photos.map((photo) => photo.buffer),
    );
  }

  @Delete(':id/photos/:photoId')
  @Requires(Permission.MANAGE_VEHICLES)
  @ApiOperation({ summary: 'Take one picture out of a vehicle gallery' })
  removeGalleryPhoto(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ): Promise<VehicleDetail> {
    return this.vehicles.removeGalleryPhoto(
      this.asUser(principal).organizationId,
      id,
      photoId,
    );
  }

  @Post(':id/photos/:photoId/promote')
  @Requires(Permission.MANAGE_VEHICLES)
  @ApiOperation({ summary: 'Make a gallery picture the main one' })
  promotePhoto(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ): Promise<VehicleDetail> {
    return this.vehicles.promotePhoto(this.asUser(principal).organizationId, id, photoId);
  }

  @Delete(':id/photo')
  @Requires(Permission.MANAGE_VEHICLES)
  @ApiOperation({ summary: 'Take the picture off a vehicle' })
  removePhoto(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<VehicleRow> {
    return this.vehicles.removePhoto(this.asUser(principal).organizationId, id);
  }

  @Delete(':id')
  @Requires(Permission.MANAGE_VEHICLES)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a vehicle nothing is attached to yet' })
  remove(
    @CurrentUser() principal: Principal,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.vehicles.remove(this.asUser(principal).organizationId, id);
  }
}
