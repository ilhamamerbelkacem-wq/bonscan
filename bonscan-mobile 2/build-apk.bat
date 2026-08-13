@echo off
chcp 65001 >nul
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║           BonScan Pro - Générateur d'APK Android              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: Vérifier Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo  ❌ Node.js n'est PAS installé.
    echo.
    echo  ➜ Téléchargez Node.js ici : https://nodejs.org
    echo  ➜ Choisissez la version "LTS" (bouton vert à gauche)
    echo  ➜ Installez-le avec les paramètres par défaut
    echo.
    pause
    exit /b 1
)

echo  ✅ Node.js détecté
echo.

:: Vérifier Android Studio
echo  🔍 Vérification d'Android Studio...
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    echo  ✅ Android Studio trouvé (Program Files)
) else if exist "%LOCALAPPDATA%\Android\Sdk" (
    echo  ✅ SDK Android trouvé
) else (
    echo  ⚠️  Android Studio non détecté automatiquement.
    echo  ➜ Si vous l'avez déjà installé, continuez quand même.
    echo  ➜ Sinon, téléchargez-le sur : https://developer.android.com/studio
    echo.
)

:: Installation des dépendances
echo.
echo  📦 Installation des dépendances Capacitor...
call npm install
if errorlevel 1 (
    echo  ❌ Erreur lors de l'installation.
    pause
    exit /b 1
)

:: Ajout de la plateforme Android si pas déjà fait
if not exist "android" (
    echo  🤖 Ajout de la plateforme Android...
    call npx cap add android
)

:: Synchronisation
echo  🔄 Synchronisation des fichiers web...
call npx cap sync android

echo.
echo  ✅ Projet prêt !
echo.
echo  ┌─────────────────────────────────────────────────────────────┐
echo  │  PROCHAINES ÉTAPES :                                        │
echo  │                                                             │
echo  │  1. Ce script va ouvrir Android Studio                      │
echo  │  2. Dans Android Studio, attendez que tout charge           │
echo  │  3. Menu : Build ▶ Build Bundle(s) / APK(s)                │
echo  │            ▶ Build APK(s)                                   │
echo  │  4. L'APK se trouve dans :                                  │
echo  │     android/app/build/outputs/apk/debug/app-debug.apk       │
echo  │  5. Transférez ce fichier sur le téléphone de votre père    │
echo  │     et installez-le (autorisez "Sources inconnues")        │
echo  └─────────────────────────────────────────────────────────────┘
echo.
pause

:: Ouvrir Android Studio
call npx cap open android
