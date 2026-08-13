# BonScan Pro — Application Android (APK)

Ce dossier contient tout le nécessaire pour transformer BonScan en une **vraie application Android** installable sur le téléphone de votre père.

---

## Prérequis (tout est gratuit)

| Logiciel | Lien de téléchargement | Pourquoi |
|---|---|---|
| **Node.js** | https://nodejs.org (cliquez sur le bouton vert **LTS**) | Pour exécuter les outils de build |
| **Android Studio** | https://developer.android.com/studio | Pour compiler l'APK |
| **Java JDK 17** | Inclus dans Android Studio | Nécessaire pour la compilation |

> 💡 **Conseil** : Installez d'abord Node.js, puis Android Studio. Gardez les paramètres par défaut pour tout.

---

## Étapes (15 minutes la première fois)

### 1. Installez Node.js
- Allez sur https://nodejs.org
- Téléchargez la version **LTS** (bouton vert de gauche)
- Installez avec les paramètres par défaut
- Pour vérifier : ouvrez un terminal et tapez `node -v` → vous devez voir un numéro de version

### 2. Installez Android Studio
- Allez sur https://developer.android.com/studio
- Téléchargez et installez
- Au premier lancement, Android Studio va télécharger le **SDK Android** — laissez-le faire (c'est long, ~1 Go)
- Quand il demande le type de projet, fermez la fenêtre (on n'en a pas besoin)

### 3. Préparez le projet
- Décompressez ce dossier `bonscan-mobile` sur votre bureau
- Ouvrez un terminal (ou l'invite de commandes) dans ce dossier :
  - **Windows** : Shift + clic droit dans le dossier → "Ouvrir PowerShell ici" ou "Ouvrir l'invite de commandes"
  - **Mac** : clic droit dans le dossier → "Nouveau terminal au dossier"

### 4. Lancez le build

**Sur Windows :**
```
.\build-apk.bat
```

**Sur Mac/Linux :**
```bash
chmod +x build-apk.sh
./build-apk.sh
```

Le script va :
1. Vérifier que Node.js est installé
2. Installer les outils Capacitor
3. Créer le projet Android
4. Ouvrir Android Studio

### 5. Compilez l'APK dans Android Studio

Une fois Android Studio ouvert :

1. **Attendez** que la barre de chargement en bas disparaisse (téléchargement des dépendances Gradle)
2. Cliquez en haut sur le menu : **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Android Studio compile — cela prend 1 à 3 minutes la première fois
4. En bas à droite, un message apparaît : **"Build Analyzer detected..."** ou simplement **"Build completed"**
5. Cliquez sur le lien **"locate"** ou **"Show in folder"**

L'APK se trouve ici :
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 6. Installez sur le téléphone de votre père

**Méthode 1 — Câble USB :**
- Branchez le téléphone au PC avec un câble USB
- Sur le téléphone, autorisez le transfert de fichiers
- Copiez `app-debug.apk` dans le dossier Téléchargements du téléphone
- Sur le téléphone, ouvrez l'application **Fichiers** → Téléchargements → touchez `app-debug.apk`
- Autorisez **"Sources inconnues"** si demandé
- Installez

**Méthode 2 — Partage (sans câble) :**
- Envoyez l'APK via WhatsApp, Telegram, email, ou Google Drive
- Téléchargez-le sur le téléphone
- Touchez le fichier pour installer

**Méthode 3 — Directement depuis Android Studio :**
- Branchez le téléphone en USB (avec mode développeur activé)
- Dans Android Studio, cliquez sur le bouton ▶️ vert (Run)
- L'app s'installe et se lance automatiquement

---

## Comment ça marche une fois installé ?

| Fonction | Comment ça marche |
|---|---|
| **Ouvrir l'app** | Comme n'importe quelle autre app, icône sur l'écran d'accueil |
| **Scanner un bon** | Bouton "Prendre une photo" → l'appareil photo du téléphone s'ouvre → photo du bon |
| **OCR** | L'app lit le texte de l'image et remplit le tableau automatiquement |
| **Modifier le tableau** | Touchez n'importe quelle cellule pour modifier |
| **Comparer les prix** | Les prix sont automatiquement comparés au bon précédent du même fournisseur |
| **Enregistrer** | Le bon est stocké dans le téléphone (IndexedDB) |
| **Historique** | Accessible même sans Internet |
| **Fonctionne hors-ligne** | ✅ Totalement, zéro connexion nécessaire |

---

## Mise à jour de l'app

Si vous modifiez le site web (fichiers dans `www/`) :

1. Modifiez les fichiers dans le dossier `www/`
2. Relancez le script `build-apk.bat` (ou `.sh`)
3. Recompilez dans Android Studio
4. Réinstallez l'APK sur le téléphone

Les anciennes données (historique) sur le téléphone sont conservées si vous utilisez le même `appId` (déjà configuré dans `capacitor.config.json`).

---

## Dépannage

### "SDK not found"
Dans Android Studio : **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK** → notez le chemin du SDK. Puis ajoutez une variable d'environnement `ANDROID_SDK_ROOT` pointant vers ce chemin.

### "Gradle sync failed"
Dans Android Studio, cliquez sur **File** → **Sync Project with Gradle Files** (icône éléphant 🐘 en haut à droite).

### L'appareil photo ne s'ouvre pas
Dans les paramètres du téléphone → Applications → BonScan Pro → Autorisations → **Caméra** → Autoriser.

### L'OCR est lent
C'est normal, Tesseract.js fonctionne directement sur le téléphone sans serveur. La première analyse peut prendre 10-30 secondes selon la puissance du téléphone.

---

## Architecture technique

```
Votre téléphone Android
    └── WebView (moteur Chrome intégré)
            ├── index.html  ← interface
            ├── style.css   ← design
            ├── app.js      ← logique + IndexedDB
            └── Tesseract.js ← OCR local
```

Aucune donnée ne quitte le téléphone. Aucun serveur. Aucun abonnement. 100% offline.
