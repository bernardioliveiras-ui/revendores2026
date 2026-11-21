@echo off
setlocal
cd /d "%~dp0"
node scripts\limpar-public.mjs
if errorlevel 1 goto falha
if exist ".git" git status --short -- public
echo Confira as exclusoes no GitHub Desktop, inclua no commit e faca Push origin.
pause
exit /b 0
:falha
echo A limpeza falhou. Confira se o Node.js 22 esta instalado.
pause
exit /b 1
