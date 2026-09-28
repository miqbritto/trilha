import { Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { AdminApiKeyGuard } from "./admin-api-key.guard";
import { ThrottlerGuard } from "@nestjs/throttler";

@Controller('admin/auth')
export class AdminAuthController {

    @Post('check')
    @HttpCode(204)
    @UseGuards(ThrottlerGuard ,AdminApiKeyGuard)
    check() {}

}