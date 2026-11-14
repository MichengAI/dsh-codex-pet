<p align="center">
  <img src="assets/branding/dsh-codex-pet-banner.png" alt="DSH Codex Pet" width="100%">
</p>

<div align="center">

# DSH Codex Pet

**Un petit compagnon pour vos tâches dans DeepSeek Harness**

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

[Journal des modifications](CHANGELOG.md) · [Apache-2.0](LICENSE)

[![Licence : Apache-2.0](https://img.shields.io/badge/Licence-Apache--2.0-blue.svg)](LICENSE)
[![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-codex-pet.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![Téléchargements npm](https://img.shields.io/npm/dt/%40michengai%2Fdsh-codex-pet.svg?label=npm%20t%C3%A9l%C3%A9chargements)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-codex-pet)
[![Node.js 22.19+](https://img.shields.io/badge/Node.js-22.19%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

> DSH Codex Pet est un plugin d'animal virtuel maintenu par la communauté pour DeepSeek Harness (DSH), et n'est pas un produit officiel d'OpenAI ou de DeepSeek AI. Depuis la version 1.0.1, il prend en charge DSH `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`–`0.2.1-rc.5`, `0.2.2-rc.1` `0.2.2-rc.2`, et `0.2.2-rc.3`. Les versions antérieures et les versions alpha de `0.2.1` sont rejetées par la vérification de compatibilité ; les configurations locales et animaux personnalisés ne sont pas supprimés.

## Fonctionnalités

Gardez un compagnon à vos côtés pendant votre travail sur DSH, suivez l'avancement de vos tâches et traitez les requêtes qui sollicitent votre attention. Choisissez parmi 9 animaux intégrés ou concevez le vôtre grâce à un Skill dédié.

- **9 animaux intégrés** : choisissez un compagnon et ajustez sa taille dans les paramètres. Les ressources graphiques sont incluses localement.
- **Compagnon intégré à la page** : vous accompagne directement dans l'interface web de DSH.
- **Vue d'ensemble multi-tâches** : surveillez les tâches en cours, terminées, les erreurs et les demandes en attente. En l'absence de notification, seul l'animal reste affiché.
- **Agir directement depuis la notification** : ouvrez la tâche liée, interrompez le tour actuel ou répondez aux demandes d'approbation d'outils, de questions ou de plans.
- **Rester au calme au besoin** : fermez un rappel sans arrêter la tâche ; masquez ou restaurez l'animal via son menu contextuel ou ses paramètres.
- **Créer son propre compagnon** : décrivez un animal dans les paramètres et lancez une tâche DSH dédiée via le Skill `hatch-pet` inclus.
- **Interactions légères** : glissez pour déplacer, double-cliquez pour faire sauter, clic droit pour le menu.

## Aperçus

### Notifications multi-tâches

Visualisez les tâches en cours à côté de votre compagnon, avec des boutons d'action dédiés pour ouvrir la conversation, arrêter le tour ou fermer la notification.

<p align="center">
  <img src="assets/screenshots/pet-notifications.png" alt="Un animal avec deux notifications de tâches en cours" width="403">
</p>

### Paramètres de l'animal

Choisissez parmi les 9 animaux intégrés, ouvrez le dossier des animaux personnalisés et réglez la taille d'affichage.

![Bibliothèque d'animaux et apparence](assets/screenshots/pet-settings.png)

### Un compagnon dans votre conversation

Poursuivez votre travail dans DSH pendant que l'animal et ses notifications veillent discrètement dans un coin de la page.

![Animal et notifications aux côtés d'une conversation DSH](assets/screenshots/pet-conversation.png)

## Écosystème DSH

Pour un poste de travail complet, téléchargez [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases). Les installations existantes de [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) peuvent ajouter des plugins selon leurs besoins :

| Plugin | Usage |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organisation des projets et conversations, recherche de tâches et navigation fluide |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Sélection et invocation d'agents spécialistes pour vos tâches |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Recherche, activation, création et importation de skills |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Recherche, restauration ou nettoyage des conversations archivées |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Envoi de tâches et réception de réponses via vos messageries instantanées |
| [Automation](https://github.com/MichengAI/dsh-automation) | Planification de tâches automatiques et consultation des comptes-rendus |
| [BTW](https://github.com/MichengAI/dsh-btw) | Questions annexes en cours de travail sans interrompre la session principale |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Commande `/simplify` pour améliorer le code dans votre diff Git |
| [PUA](https://github.com/MichengAI/dsh-pua) | Inciter l'agent à explorer d'autres voies après un échec et vérifier minutieusement |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Commande `/review` pour obtenir une revue de code indépendante |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Suivi des notifications et approbation d'outils via un animal virtuel |

## Installation

Versions compatibles de DeepSeek Harness : **`0.2.0-rc.1`**, **`0.2.0-rc.2`**, **`0.2.1-rc.1`–`0.2.1-rc.5`**, **`0.2.2-rc.1`** et **`0.2.2-rc.2`, `0.2.2-rc.3`**. Vérifiez que la commande `dsh` est disponible.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-codex-pet@latest --registry=https://registry.npmjs.org/ --ignore-scripts
```

Redémarrez DSH après l'installation, puis ouvrez **Paramètres → Animaux** (ou **Settings → Pets**).

## Utilisation

Ouvrez **Paramètres → Animaux** ou utilisez le clic droit sur l'animal.

| Action recherchée | Manipulation |
| --- | --- |
| Choisir un compagnon | Sélectionnez un animal dans les paramètres et réglez sa taille. |
| Déplacer ou interagir | Glissez l'animal avec la souris ; double-cliquez pour le faire sauter. |
| Suivre les tâches | Consultez les bulles de notification ; dépliez la liste si plusieurs tâches tournent. |
| Ouvrir la conversation | Cliquez sur la notification pour afficher la tâche DSH associée. |
| Traiter une demande | Affichez les détails et répondez aux approbations d'outils ou questions. |
| Interrompre un tour | Cliquez sur le bouton stop de la notification de tâche active. |
| Fermer un rappel | Cliquez sur la croix (la tâche continue de tourner en arrière-plan). |
| Masquer / afficher | Utilisez le menu clic droit ou le panneau de paramètres. |

### Créer un animal personnalisé

1. Ouvrez les paramètres, cliquez sur **+** (`Créer`) et décrivez votre animal.
2. Cliquez sur **Créer dans DSH**. Une conversation dédiée s'ouvre avec les instructions du Skill.
3. Suivez la génération (nécessite un outil de génération d'images configuré dans DSH).
4. Une fois l'animal généré et sauvegardé, actualisez la bibliothèque pour le sélectionner.

## Mise à jour et désinstallation

Pour mettre à jour le plugin :

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-codex-pet@latest --registry=https://registry.npmjs.org/ --ignore-scripts
```

Pour le désinstaller :

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web remove @michengai/dsh-codex-pet
```

Les animaux personnalisés sont enregistrés par défaut dans `.dsh/codex-pet/pets` de votre dossier utilisateur. La désinstallation du plugin conserve vos créations et paramètres intacts.

## Contribuer

Consultez le [guide de développement et de validation (en chinois)](https://github.com/MichengAI/dsh-codex-pet/blob/main/CONTRIBUTING.md) pour découvrir les procédures de développement local, de test et de publication. GitHub et npm contiennent tous deux un dossier `lib` prêt à l'emploi ; après toute modification des sources, exécutez `npm run build` avant de valider.

## Licence

Le code d'origine de ce plugin est sous licence [Apache License 2.0](LICENSE). Les sprites et animations pixel-art des animaux proviennent d'OpenAI Codex et sont exclus de la licence Apache-2.0 de ce dépôt ; consultez [NOTICE](NOTICE) pour plus de détails.
