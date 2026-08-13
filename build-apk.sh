#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           BonScan Pro - Générateur d'APK Android              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est PAS installé."
    echo ""
    echo "➜ Téléchargez Node.js ici : https://nodejs.org"
    echo "➜ Choisissez la version 'LTS' (bouton vert à gauche)"
    echo ""
    exit 1
fi

echo "✅ Node.js détecté : $(node -v)"
echo ""

# Vérifier Android Studio
if [ -d "/Applications/Android Studio.app" ] || [ -d "$HOME/Android/Sdk" ]; then
    echo "✅ Android Studio / SDK détecté"
else
    echo "⚠️  Android Studio non détecté automatiquement."
    echo "➜ Si vous l'avez déjà installé, continuez quand même."
    echo "➜ Sinon : https://developer.android.com/studio"
    echo ""
fi

# Installation
echo "📦 Installation des dépendances Capacitor..."
npm install

# Ajout plateforme
if [ ! -d "android" ]; then
    echo "🤖 Ajout de la plateforme Android..."
    npx cap add android
fi

# Sync
echo "🔄 Synchronisation des fichiers web..."
npx cap sync android

echo ""
echo "✅ Projet prêt !"
echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│  PROCHAINES ÉTAPES :                                        │"
echo "│                                                             │"
echo "│  1. Ce script va ouvrir Android Studio                      │"
echo "│  2. Dans Android Studio, attendez que tout charge           │"
echo "│  3. Menu : Build ▸ Build Bundle(s) / APK(s)                │"
echo "│            ▸ Build APK(s)                                   │"
echo "│  4. L'APK se trouve dans :                                  │"
echo "│     android/app/build/outputs/apk/debug/app-debug.apk       │"
echo "│  5. Transférez ce fichier sur le téléphone et installez-le  │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""
read -p "Appuyez sur Entrée pour ouvrir Android Studio..."

npx cap open android
