import { Request, Response } from 'express';
import httpStatus from 'http-status';
import config from '../../../config';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthServices } from '../auth/auth.service';

const parseExpiry = (expiryString: string, defaultAge: number): number => {
  if (!expiryString) return defaultAge;
  const unit = expiryString.slice(-1);
  const value = parseInt(expiryString.slice(0, -1));
  if (isNaN(value)) return defaultAge;
  if (unit === 'y') return value * 365 * 24 * 60 * 60 * 1000;
  if (unit === 'M') return value * 30 * 24 * 60 * 60 * 1000;
  if (unit === 'w') return value * 7 * 24 * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 's') return value * 1000;
  return defaultAge;
};

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const accessTokenMaxAge = parseExpiry(config.jwt.expires_in as string, 1000 * 60 * 60);
  const refreshTokenMaxAge = parseExpiry(config.jwt.refresh_token_expires_in as string, 1000 * 60 * 60 * 24 * 30);

  const result = await AuthServices.loginUser(req.body);
  const { refreshToken, accessToken } = result;
  res.cookie('accessToken', accessToken, {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: accessTokenMaxAge,
  });
  res.cookie('refreshToken', refreshToken, {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: refreshTokenMaxAge,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Logged in successfully!',
    data: {
      needPasswordChange: result.needPasswordChange,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  const accessTokenMaxAge = parseExpiry(config.jwt.expires_in as string, 1000 * 60 * 60);
  const refreshTokenMaxAge = parseExpiry(config.jwt.refresh_token_expires_in as string, 1000 * 60 * 60 * 24 * 30);

  const result = await AuthServices.refreshToken(refreshToken);
  res.cookie('accessToken', result.accessToken, {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: accessTokenMaxAge,
  });

  res.cookie('refreshToken', result.refreshToken, {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: refreshTokenMaxAge,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Access token generated successfully!',
    data: {
      message: 'Access token generated successfully!',
    },
  });
});

const changePassword = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const user = req.user;

  const result = await AuthServices.changePassword(user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password Changed successfully',
    data: result,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Check your email!',
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  // Extract token from Authorization header (remove "Bearer " prefix)
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;
  const user = req.user; // Will be populated if authenticated via middleware

  await AuthServices.resetPassword(token, req.body, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password Reset!',
    data: null,
  });
});

const getMe = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const user = req.user;

  const result = await AuthServices.getMe(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

export const AuthController = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};
