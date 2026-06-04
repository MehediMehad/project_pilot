import config from '../config';
import prisma from '../shared/prisma';

interface ProjectData {
    name: string;
    description: string;
    deadline: string;
    status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
    createdById: string; // Project Manager ID
}

async function createProjects() {
    try {
        console.log('📦 Database connected successfully');

        // Get all PROJECT_MANAGER users
        const projectManagers = await prisma.user.findMany({
            where: {
                role: 'PROJECT_MANAGER'
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        if (projectManagers.length === 0) {
            console.error('❌ No project managers found! Please run seed-users.ts first.');
            return;
        }

        console.log(`\n👥 Found ${projectManagers.length} Project Managers:\n`);
        projectManagers.forEach(pm => {
            console.log(`  - ${pm.name} (${pm.email})`);
        });

        const email = "project.manager.demo@gmail.com";

        // Check for demo project manager
        const demoPM = await prisma.user.findFirst({
            where: {
                email: email
            }
        });

        // If demo PM doesn't exist, create one
        let demoPMId = demoPM?.id;

        if (!demoPM) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('123456', Number(config.salt_round));

            // if demo PM doesn't exist, create one


            // Create demo project manager
            const newDemoPM = await prisma.user.create({
                data: {
                    name: 'Demo Project Manager',
                    email: email,
                    password: hashedPassword,
                    role: 'PROJECT_MANAGER',
                    status: 'ACTIVE',
                    image: 'https://randomuser.me/api/portraits/men/13.jpg'
                }
            });
            demoPMId = newDemoPM.id;
            projectManagers.push(newDemoPM);
            console.log(`\n✅ Created Demo Project Manager: ${newDemoPM.name}`);
        }

        // Project assignments (first 5 projects for demo PM, rest distributed among others)
        const projectAssignments: { name: string; description: string; managerId: string }[] = [];

        // 5 projects for demo PM
        for (let i = 1; i <= 5; i++) {
            projectAssignments.push({
                name: `Demo Project ${i}`,
                description: `This is demo project ${i} for demonstration purposes. This project includes various features and functionalities.`,
                managerId: demoPMId!
            });
        }

        // Distribute remaining 10 projects among other project managers
        const otherManagers = projectManagers.filter(pm => pm.id !== demoPMId);

        if (otherManagers.length > 0) {
            let managerIndex = 0;
            for (let i = 6; i <= 15; i++) {
                const currentManager = otherManagers[managerIndex % otherManagers.length];
                projectAssignments.push({
                    name: `Enterprise Project ${i}`,
                    description: `Enterprise level project ${i} assigned to ${currentManager.name}. This project focuses on business solutions and client requirements.`,
                    managerId: currentManager.id
                });
                managerIndex++;
            }
        }

        const projects: ProjectData[] = [];
        const today = new Date();

        // Create deadlines for projects (1 month to 6 months from today)
        for (let i = 0; i < projectAssignments.length; i++) {
            const assignment = projectAssignments[i];
            const monthsToAdd = (i % 6) + 1; // 1 to 6 months
            const deadline = new Date(today);
            deadline.setMonth(today.getMonth() + monthsToAdd);

            // Alternate statuses
            let status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' = 'ACTIVE';
            if (i % 5 === 2) status = 'ON_HOLD';
            if (i % 7 === 0) status = 'COMPLETED';

            projects.push({
                name: assignment.name,
                description: assignment.description,
                deadline: deadline.toISOString(),
                status: status,
                createdById: assignment.managerId
            });
        }

        console.log('\n📋 Creating projects...\n');

        // Create projects
        let createdCount = 0;
        let skippedCount = 0;

        for (const project of projects) {
            // Check if project already exists
            const existingProject = await prisma.project.findFirst({
                where: {
                    name: project.name,
                    createdById: project.createdById
                }
            });

            if (existingProject) {
                console.log(`⚠️  Project "${project.name}" already exists, skipping...`);
                skippedCount++;
                continue;
            }

            // Create the project
            const createdProject = await prisma.project.create({
                data: {
                    name: project.name,
                    description: project.description,
                    deadline: project.deadline,
                    status: project.status,
                    createdById: project.createdById
                },
                include: {
                    createdBy: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            });

            console.log(`✅ Created project: "${createdProject.name}"`);
            console.log(`   Manager: ${createdProject.createdBy?.name}`);
            console.log(`   Status: ${createdProject.status}`);
            console.log(`   Deadline: ${new Date(createdProject.deadline).toLocaleDateString()}`);
            console.log(`   ---`);
            createdCount++;
        }

        console.log('\n🎉 Project creation completed!');
        console.log(`📊 Summary:`);
        console.log(`  ✅ Created: ${createdCount} projects`);
        console.log(`  ⚠️  Skipped: ${skippedCount} projects`);
        console.log(`  📋 Total: ${projects.length} projects`);

        // Display projects by manager
        const projectsByManager = await prisma.project.groupBy({
            by: ['createdById'],
            _count: {
                id: true
            }
        });

        console.log('\n📊 Projects per Project Manager:');
        for (const group of projectsByManager) {
            const manager = await prisma.user.findUnique({
                where: { id: group.createdById },
                select: { name: true, email: true }
            });
            if (manager) {
                console.log(`  👨‍💼 ${manager.name} (${manager.email}): ${group._count.id} projects`);
            }
        }

    } catch (error) {
        console.error('❌ Error creating projects:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the function
createProjects();