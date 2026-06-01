import { User, Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Request } from 'express';
import config from '../../../config';
import { fileUploader } from '../../../helpers/fileUploader';
import { paginationHelper } from '../../../helpers/paginationHelper';
import prisma from '../../../shared/prisma';
import { IAuthUser } from '../../interfaces/common';
import { IPaginationOptions } from '../../interfaces/pagination';
import { userSearchAbleFields } from './user.constant';

const registerUser = async (req: Request): Promise<User> => {
  const file = req.file;
  let profilePhoto = null;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    profilePhoto = uploadToCloudinary?.secure_url;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, Number(config.salt_round));

  const result = await prisma.user.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      role: req.body.role || UserRole.TEAM_MEMBER,
      image: profilePhoto,
      status: UserStatus.ACTIVE,
    },
  });

  return result;
};

const getAllFromDB = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  if (params.searchTerm) {
    andConditions.push({
      OR: userSearchAbleFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: 'desc',
          },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const changeProfileStatus = async (id: string, payload: { status: UserStatus }) => {
  const updateUserStatus = await prisma.user.update({
    where: {
      id,
    },
    data: {
      status: payload.status,
    },
  });

  return updateUserStatus;
};

const getMyProfile = async (user: IAuthUser) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return userInfo;
};

const updateMyProfile = async (user: IAuthUser, req: Request) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
      status: UserStatus.ACTIVE,
    },
  });

  const file = req.file;
  let profilePhoto = userInfo.image;
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    profilePhoto = uploadToCloudinary?.secure_url;
  }

  const updatedData = {
    name: req.body.name,
    image: profilePhoto,
  };

  const result = await prisma.user.update({
    where: {
      email: userInfo.email,
    },
    data: updatedData,
  });

  return result;
};

export const userService = {
  registerUser,
  getAllFromDB,
  changeProfileStatus,
  getMyProfile,
  updateMyProfile,
};
