@echo off
cd /d "%~dp0admin-server"

REM ==================================================
REM MODO DE EXECUCAO (descomente o desejado)
REM ==================================================

REM --- MODO DESENVOLVIMENTO (HTTP na porta 3001) ---
REM JWT_SECRET é carregado do arquivo .env
set PORT=3001
set CORS_ORIGIN=http://localhost:3001,https://moliveiraseguranca.com.br,https://www.moliveiraseguranca.com.br
set HTTPS_MODE=http

REM --- MODO PRODUCAO (HTTPS com Let's Encrypt) ---
REM Descomente as linhas abaixo para producao:
REM set JWT_SECRET=COLOQUE_UMA_SENHA_FORTE_AQUI
REM set DOMAIN=moliveiraseguranca.com.br
REM set CORS_ORIGIN=https://%DOMAIN%,https://www.%DOMAIN%
REM set HTTPS_MODE=letsencrypt
REM set LETSENCRYPT_EMAIL=seu@email.com

REM --- MODO PRODUCAO (HTTPS com certificado manual) ---
REM Descomente para usar certificados propios (ex: Certbot):
REM set HTTPS_MODE=cert
REM set SSL_KEY_PATH=C:\caminho\para\privkey.pem
REM set SSL_CERT_PATH=C:\caminho\para\fullchain.pem
REM set DOMAIN=moliveiraseguranca.com.br
REM set CORS_ORIGIN=https://%DOMAIN%,https://www.%DOMAIN%

REM ==================================================

echo ========================================
echo    PAINEL ADMINISTRATIVO M. OLIVEIRA
echo ========================================
echo.
echo Modo: %HTTPS_MODE%
echo.
start http://localhost:%PORT%/admin

echo.
echo ========================================
echo   Servidor rodando! Nao feche esta janela
echo ========================================
echo.
echo Pressione CTRL+C para parar
echo ========================================

npm start
