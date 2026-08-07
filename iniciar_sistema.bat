@echo off
title Sistema Joia Rara - Servidor Local
echo Iniciando o servidor do Sistema Joia Rara...
echo Aguarde alguns segundos...

:: Abre o navegador padrao na porta do seu sistema (ex: 3000 ou 8080)
start http://localhost:3000

:: Inicia a aplicação Node.js
npm start

pause