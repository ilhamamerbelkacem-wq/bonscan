# BonScan Pro v2 — Application Android

## Problème avec la v1 ?
La v1 utilisait IndexedDB et des fichiers séparés qui ne fonctionnaient pas bien dans la WebView Android.
Cette v2 est **100% simplifiée** : tout est dans un seul fichier HTML, localStorage au lieu d'IndexedDB, et du JavaScript compatible avec toutes les WebView.

## Comment recompiler

1. Sur GitHub, allez dans votre repo `bonscan`
2. Uploadez les nouveaux fichiers (remplacez les anciens)
3. Allez dans **Actions** → **Build APK** → **Run workflow**
4. Attendez 5-10 minutes
5. Téléchargez l'APK dans **Artifacts**
6. Installez sur le téléphone

## Structure des fichiers à uploader

```
.github/workflows/build-apk.yml
www/
  index.html      ← TOUT est dedans (HTML + CSS + JS)
  manifest.json
  sw.js
  icons/
package.json
capacitor.config.json
```

## Fonctionnalités
- ✅ Zéro dépendance externe
- ✅ Fonctionne hors-ligne
- ✅ localStorage (données conservées)
- ✅ Tableau éditable avec alertes prix
- ✅ Historique par fournisseur
- ✅ Stats et évolution des prix
