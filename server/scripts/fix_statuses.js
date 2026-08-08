const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting Status Unification Script...");

    // 1. Update Projects
    const projects = await prisma.project.findMany({
        select: { id: true, status: true }
    });

    console.log(`Checking ${projects.length} projects...`);
    for (const project of projects) {
        if (project.status && project.status !== project.status.toUpperCase()) {
            await prisma.project.update({
                where: { id: project.id },
                data: { status: project.status.toUpperCase() }
            });
            console.log(`Updated Project ${project.id}: ${project.status} -> ${project.status.toUpperCase()}`);
        }
    }

    // 2. Update Tasks
    const tasks = await prisma.task.findMany({
        select: { id: true, status: true }
    });

    console.log(`Checking ${tasks.length} tasks...`);
    for (const task of tasks) {
        if (task.status && task.status !== task.status.toUpperCase()) {
            await prisma.task.update({
                where: { id: task.id },
                data: { status: task.status.toUpperCase() }
            });
            console.log(`Updated Task ${task.id}: ${task.status} -> ${task.status.toUpperCase()}`);
        }
    }

    console.log("Status Unification Complete!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
