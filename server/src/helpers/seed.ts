import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import config from '../config';
import prisma from '../shared/prisma';

const seedSuperAdmin = async () => {
  try {
    const isExistSuperAdmin = await prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
      },
    });

    if (isExistSuperAdmin) {
      console.log('Admin already exists!');
      return;
    }

    const hashedPassword = await bcrypt.hash('123456', Number(config.salt_round));

    const adminData = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
    });

    console.log('Admin User Created Successfully!', adminData);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
};

export default seedSuperAdmin;
