import {
  Controller,
  HttpStatus,
  Logger,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { TsRestException, TsRestHandler, tsRestHandler } from "@ts-rest/nest";
import { contracts } from "@myorg/api-client";
import { type Response } from "express";
import { FirebaseAuthGuard, ReqWithUser } from "./guards/firebase-auth.guard";

@Controller()
@UseGuards(FirebaseAuthGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @TsRestHandler(contracts.auth.login)
  public async login(@Res({ passthrough: true }) res: Response) {
    return tsRestHandler(contracts.auth.login, async ({ headers }) => {
      const accessToken = headers.authorization.replace("Bearer ", "");

      try {
        const { userInfo } = await this.authService.verifyAndUpsertUser(
          accessToken
        );

        const { sessionCookie, expiresIn } =
          await this.authService.createSessionCookie(accessToken);
        res.cookie("session", sessionCookie, {
          maxAge: expiresIn,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });

        return {
          status: HttpStatus.OK,
          body: userInfo,
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            status: HttpStatus.UNAUTHORIZED,
            body: {
              message: "You're not authorized to access this resource",
            },
          };
        }

        this.logger.error(error);
        return {
          status: 500,
          body: {
            message: "Internal server error",
          },
        };
      }
    });
  }

  @TsRestHandler(contracts.auth.me)
  @UseGuards(FirebaseAuthGuard)
  public async me(@Req() req: ReqWithUser) {
    return tsRestHandler(contracts.auth.me, async () => {
      try {
        return {
          status: HttpStatus.OK,
          body: await this.authService.getUserInfo(req.user.email),
        };
      } catch (error) {
        if (error instanceof TsRestException) throw error;
        this.logger.error(`Error at /me: ${error}`);
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          body: {
            message: "Internal server error",
          },
        };
      }
    });
  }

  @TsRestHandler(contracts.auth.logout)
  @UseGuards(FirebaseAuthGuard)
  public async logout(
    @Req() req: ReqWithUser,
    @Res({ passthrough: true }) res: Response
  ) {
    return tsRestHandler(contracts.auth.logout, async () => {
      try {
        await this.authService.revokeToken(req.cookies.session);
        res.clearCookie("session");
        return {
          status: HttpStatus.OK,
          body: null,
        };
      } catch (error) {
        if (error instanceof TsRestException) throw error;
        this.logger.error(`Error at /logout: ${error}`);
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          body: {
            message: "Internal server error",
          },
        };
      }
    });
  }
}
