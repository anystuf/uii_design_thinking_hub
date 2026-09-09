import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';

@Controller('auth')
export class AuthController {
  @Get('dev-me')
  @UseGuards(DevAuthGuard)
  devMe(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
