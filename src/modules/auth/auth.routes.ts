import { Router } from 'express';
import { AuthController } from './controllers/auth.controller';
import { validateRequest } from '../../core/middlewares/validation.middleware';
import { authenticate } from '../../core/middlewares/auth.middleware';
import { authRateLimiter } from '../../core/middlewares/rate-limiter.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './schemas/auth.schema';

const authRouter = Router();
const controller = new AuthController();

authRouter.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  controller.register
);

authRouter.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  controller.login
);

authRouter.post(
  '/refresh-token',
  validateRequest({ body: refreshTokenSchema }),
  controller.refreshToken
);

authRouter.post(
  '/logout',
  validateRequest({ body: refreshTokenSchema }),
  controller.logout
);

authRouter.get(
  '/me',
  authenticate,
  controller.getMe
);

authRouter.put(
  '/change-password',
  authenticate,
  validateRequest({ body: changePasswordSchema }),
  controller.changePassword
);

export { authRouter };
