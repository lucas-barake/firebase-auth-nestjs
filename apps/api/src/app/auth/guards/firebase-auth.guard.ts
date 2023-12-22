import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { type Request } from "express";
import { admin } from "../firebase-admin.module";

export type ReqWithUser = Request & {
  user: {
    id: string;
    email: string;
  };
  token: string;
};

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ReqWithUser>();
    const sessionCookie = request.cookies.session as string | undefined | null;

    if (!sessionCookie) return false;

    try {
      const decodedClaims = await admin
        .auth()
        .verifySessionCookie(sessionCookie, true);
      if (!decodedClaims.email) return false;

      request.user = {
        email: decodedClaims.email,
        id: decodedClaims.dbUserId,
      };

      return true;
    } catch (_error) {
      return false;
    }
  }
}
