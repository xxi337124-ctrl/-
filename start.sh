#!/bin/bash

echo "======================================"
echo "  Content Factory - 快速启动脚本"
echo "======================================"
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未安装Node.js,请先安装Node.js 18+"
    exit 1
fi

echo "✅ Node.js版本: $(node -v)"
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    echo ""
fi

# 检查数据库
if [ ! -f "prisma/dev.db" ]; then
    echo "🗄️  初始化数据库..."
    npx prisma migrate dev --name init
    echo ""
fi

# 清除缓存
echo "🧹 清除缓存..."
rm -rf .next
echo ""

# 启动服务
echo "🚀 启动开发服务器..."
echo ""
echo "访问地址: http://localhost:3000"
echo ""
echo "======================================"
npm run dev
