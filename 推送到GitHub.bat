@echo off
chcp 65001 >nul
echo ====================================
echo   GitHub 代码推送工具
echo ====================================
echo.
echo 准备推送代码到 GitHub...
echo.

cd /d "%~dp0"

echo 当前目录: %CD%
echo.

echo 正在推送...
git push origin master

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================
    echo   ✅ 推送成功！
    echo ====================================
    echo.
    echo 接下来请：
    echo 1. 访问 https://vercel.com
    echo 2. 用 GitHub 账号登录
    echo 3. 导入项目并部署
    echo.
    echo 详细步骤请查看：部署准备完成.md
    echo.
) else (
    echo.
    echo ====================================
    echo   ❌ 推送失败
    echo ====================================
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. 需要 VPN 或代理
    echo.
    echo 解决方案：
    echo 1. 使用 GitHub Desktop 推送（推荐）
    echo 2. 连接 VPN 后重新运行此脚本
    echo 3. 使用手机热点连接后重试
    echo.
)

pause
