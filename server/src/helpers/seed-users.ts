import * as bcrypt from 'bcryptjs';
import config from '../config';
import prisma from '../shared/prisma';

// PrismaClient কে সঠিকভাবে initialize করুন

async function createUsers() {
    try {
        // প্রথমে Prisma connect হচ্ছে কিনা চেক করুন
        console.log('📦 Database connected successfully')

        const users = [
            // Project Managers (4 users)
            {
                name: 'John Smith',
                email: 'john.smith@example.com',
                password: 'Password@123',
                role: 'PROJECT_MANAGER',
                image: 'https://randomuser.me/api/portraits/men/1.jpg'
            },
            {
                name: 'Sarah Johnson',
                email: 'sarah.johnson@example.com',
                password: 'Password@123',
                role: 'PROJECT_MANAGER',
                image: 'https://randomuser.me/api/portraits/women/2.jpg'
            },
            {
                name: 'Michael Chen',
                email: 'michael.chen@example.com',
                password: 'Password@123',
                role: 'PROJECT_MANAGER',
                image: 'https://randomuser.me/api/portraits/men/3.jpg'
            },
            {
                name: 'Emily Rodriguez',
                email: 'emily.rodriguez@example.com',
                password: 'Password@123',
                role: 'PROJECT_MANAGER',
                image: 'https://randomuser.me/api/portraits/women/4.jpg'
            },
            // Team Members (8 users)
            {
                name: 'David Wilson',
                email: 'david.wilson@example.com',
                password: 'Password@123',
                role: 'TEAM_MEMBER',
                image: 'https://randomuser.me/api/portraits/men/5.jpg'
            },
            {
                name: 'Lisa Anderson',
                email: 'lisa.anderson@example.com',
                password: 'Password@123',
                role: 'TEAM_MEMBER',
                image: 'https://randomuser.me/api/portraits/women/6.jpg'
            },
            {
                name: 'James Taylor',
                email: 'james.taylor@example.com',
                password: 'Password@123',
                role: 'TEAM_MEMBER',
                image: 'https://randomuser.me/api/portraits/men/7.jpg'
            },
            {
                name: 'Maria Garcia',
                email: 'maria.garcia@example.com',
                password: 'Password@123',
                role: 'TEAM_MEMBER',
                image: 'https://randomuser.me/api/portraits/women/8.jpg'
            },
            {
                name: 'Robert Brown',
                email: 'robert.brown@example.com',
                password: 'Password@123',
                role: 'TEAM_MEMBER',
                image: 'https://randomuser.me/api/portraits/men/9.jpg'
            },
            {
                name: 'Jennifer Lee',
                email: 'jennifer.lee@example.com',
                password: 'Password@123',
                role: 'TEAM_MEMBER',
                image: 'https://randomuser.me/api/portraits/women/10.jpg'
            },
            {
                name: 'Thomas Martinez',
                email: 'thomas.martinez@example.com',
                password: 'Password@123',
                role: 'TEAM_MEMBER',
                image: 'https://randomuser.me/api/portraits/men/11.jpg'
            },
            {
                name: 'Patricia White',
                email: 'patricia.white@example.com',
                password: 'Password@123',
                role: 'TEAM_MEMBER',
                image: 'https://randomuser.me/api/portraits/women/12.jpg'
            }
        ]

        for (const user of users) {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: user.email }
            })

            if (existingUser) {
                console.log(`⚠️  User ${user.email} already exists, skipping...`)
                continue
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash('123456', Number(config.salt_round));

            // Create the user
            const createdUser = await prisma.user.create({
                data: {
                    name: user.name,
                    email: user.email,
                    password: hashedPassword,
                    role: user.role as any,
                    image: user.image,
                    status: 'ACTIVE'
                }
            })

            console.log(`✅ Created user: ${createdUser.name} (${createdUser.role})`)
        }

        console.log('\n🎉 Successfully created users!')

        // Display summary
        const userCount = await prisma.user.groupBy({
            by: ['role'],
            _count: {
                role: true
            }
        })

        console.log('\n📊 Summary:')
        userCount.forEach(group => {
            console.log(`  ${group.role}: ${group._count.role} users`)
        })

    } catch (error) {
        console.error('❌ Error creating users:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the function
createUsers()