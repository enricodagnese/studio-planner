@echo off
:: Disabilita l'output dei comandi per pulizia
title Studio Planner Auto-Update

echo ===================================================
echo   STUDIO PLANNER - AGGIORNAMENTO AUTOMATICO
echo ===================================================
echo.
echo 1. Preparazione dei file modificati (git add)...
git add .

echo 2. Salvataggio delle modifiche (git commit)...
:: Usa la data e l'ora corrente come messaggio di commit automatico
git commit -m "Aggiornamento automatico del %date% alle %time%"

echo 3. Invio a GitHub (git push)...
git push

echo.
echo ===================================================
echo   COMPLETATO!
echo   Vercel sta gia mettendo online il nuovo layout!
echo ===================================================
echo.
pause
