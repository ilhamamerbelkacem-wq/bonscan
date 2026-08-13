# BonScan Pro — Compilation Cloud (sans Android Studio)

Votre Mac a un problème de compatibilité avec Android Studio. Pas de panique : on va compiler l'APK **gratuitement dans le cloud** avec GitHub. Vous n'avez besoin d'aucun logiciel sur votre Mac.

---

## Ce dont vous avez besoin

| Outil | Lien | Coût |
|---|---|---|
| Un compte GitHub | https://github.com/signup | 0 € |
| Ce dossier `bonscan-mobile` | Vous l'avez déjà | — |

**Rien d'autre.** Pas d'Android Studio. Pas de Node.js. Pas de Java.

---

## Étapes (10 minutes)

### 1. Créez un compte GitHub
- Allez sur https://github.com/signup
- Inscrivez-vous avec votre email (c'est gratuit)
- Vérifiez votre email

### 2. Créez un nouveau repository
- Une fois connecté, cliquez sur le **+** en haut à droite → **New repository**
- Nom du repository : `bonscan`
- Cochez **Public** (sinon GitHub Actions n'est pas gratuit)
- Cochez **Add a README file**
- Cliquez sur **Create repository**

### 3. Uploadez les fichiers
- Dans votre nouveau repo, cliquez sur **« Add file »** → **« Upload files »**
- Glissez-déposez **TOUT le contenu** du dossier `bonscan-mobile` :
  - Le dossier `www/`
  - Le dossier `.github/`
  - Les fichiers `package.json`, `capacitor.config.json`
- **Important** : assurez-vous que la structure contient bien le dossier `.github/workflows/`
- Cliquez sur **Commit changes**

### 4. Lancez la compilation
- Dans votre repo, cliquez sur l'onglet **Actions** (en haut)
- Vous verrez le workflow **« Build APK »**
- Cliquez dessus, puis cliquez sur le bouton **« Run workflow »** (à droite)
- Cliquez sur le bouton vert **« Run workflow »**

### 5. Attendez 5-10 minutes
- GitHub compile automatiquement l'APK dans le cloud
- Rafraîchissez la page, vous verrez une barre de progression
- Quand c'est vert ✅, c'est terminé

### 6. Téléchargez l'APK
- Cliquez sur le workflow terminé (la ligne verte)
- En bas, dans la section **Artifacts**, cliquez sur **bonscan-apk**
- Le fichier ZIP se télécharge
- Décompressez-le : vous obtenez `app-debug.apk`

### 7. Installez sur le téléphone de votre père
- Envoyez le fichier `app-debug.apk` sur le téléphone :
  - Par **WhatsApp** (envoyez-vous le fichier)
  - Par **email**
  - Par **Google Drive**
  - Par **câble USB**
- Sur le téléphone, touchez le fichier
- Autorisez **« Sources inconnues »** si demandé
- Installez

---

## Mise à jour de l'app

Si vous modifiez le site (fichiers dans `www/`) :

1. Sur GitHub, allez dans votre repo
2. Uploadez les nouveaux fichiers (écrasez les anciens)
3. Allez dans **Actions** → **Run workflow**
4. Téléchargez le nouvel APK
5. Réinstallez sur le téléphone (les données restent)

---

## Dépannage

### « Workflow not found »
Vérifiez que le dossier `.github/workflows/` est bien uploadé avec le fichier `build-apk.yml` dedans.

### Le build échoue
Cliquez sur la ligne rouge du workflow pour voir l'erreur. Copiez le message et demandez de l'aide.

### L'APK ne s'installe pas sur le téléphone
- Vérifiez que le téléphone autorise les **sources inconnues** : Paramètres → Sécurité → Sources inconnues
- Essayez de renommer le fichier en `bonscan.apk` avant de l'envoyer

---

## Résumé

| Étape | Temps |
|---|---|
| Créer compte GitHub | 2 min |
| Créer repo + uploader | 3 min |
| Lancer compilation | 1 min |
| Attendre la compilation | 5-10 min |
| Installer sur téléphone | 2 min |
| **Total** | **~15 min** |

**Coût total : 0 €. Aucun logiciel à installer.**
