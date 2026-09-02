import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  ForbiddenException,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Principal } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, Requires } from '../auth/guards';
import { Permission } from '../entities';
import { UpdateOrganizationDto } from './dto';
import { OrganizationService, type OrganizationProfile } from './organization.service';

/**
 * Singular and with no id in the path: the organization you get is the
 * one your token belongs to, so there is no id to tamper with and no way
 * to ask for somebody else's.
 *
 * Everyone may read it. Correcting it is a permission, so which role
 * can do that is the client's decision.
 */
/* A logo is a mark, not a photograph: anything approaching this size is
 * a mistake worth catching before it is stored. */
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

@ApiTags('organization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizations: OrganizationService) {}

  private asUser(principal: Principal) {
    if (principal.kind !== 'user') throw new ForbiddenException('Not a fleet member');
    return principal;
  }

  @Get()
  @ApiOperation({ summary: 'The organization the caller belongs to' })
  get(@CurrentUser() principal: Principal): Promise<OrganizationProfile> {
    return this.organizations.get(this.asUser(principal).organizationId);
  }

  @Patch()
  @Requires(Permission.EDIT_ORGANIZATION)
  @ApiOperation({ summary: 'Correct the organization details' })
  update(
    @CurrentUser() principal: Principal,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationProfile> {
    return this.organizations.update(this.asUser(principal).organizationId, dto);
  }

  @Post('logo')
  @Requires(Permission.EDIT_ORGANIZATION)
  @UseInterceptors(FileInterceptor('logo', { limits: { fileSize: MAX_LOGO_BYTES } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Put your own mark on the interface' })
  setLogo(
    @CurrentUser() principal: Principal,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_LOGO_BYTES }),
          // svg is not here on purpose: it is a document that can carry
          // script, and it would be served from the same origin
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    logo: Express.Multer.File,
  ): Promise<OrganizationProfile> {
    return this.organizations.setLogo(this.asUser(principal).organizationId, logo.buffer);
  }

  @Delete('logo')
  @Requires(Permission.EDIT_ORGANIZATION)
  @ApiOperation({ summary: 'Go back to the default mark' })
  removeLogo(@CurrentUser() principal: Principal): Promise<OrganizationProfile> {
    return this.organizations.removeLogo(this.asUser(principal).organizationId);
  }
}
