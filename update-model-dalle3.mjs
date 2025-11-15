import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateModel() {
  try {
    const result = await prisma.promptSettings.updateMany({
      where: { userId: 'default' },
      data: { imageModel: 'dall-e-3' },
    });

    console.log('✅ 已更新数据库imageModel为dall-e-3');
    console.log(`📊 影响的记录数: ${result.count}`);

    // 验证更新
    const settings = await prisma.promptSettings.findUnique({
      where: { userId: 'default' },
    });

    console.log(`🔍 当前imageModel: ${settings?.imageModel}`);
  } catch (error) {
    console.error('❌ 更新失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateModel();
