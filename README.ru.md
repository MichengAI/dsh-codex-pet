<p align="center">
  <img src="assets/branding/dsh-codex-pet-banner.png" alt="DSH Codex Pet" width="100%">
</p>

<div align="center">

# DSH Codex Pet

**Маленький виртуальный питомец для ваших задач в DeepSeek Harness**

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

[История изменений](CHANGELOG.md) · [Apache-2.0](LICENSE)

[![Лицензия: Apache-2.0](https://img.shields.io/badge/Лицензия-Apache--2.0-blue.svg)](LICENSE)
[![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-codex-pet.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![npm скачивания](https://img.shields.io/npm/dt/%40michengai%2Fdsh-codex-pet.svg?label=npm%20скачивания)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-codex-pet)
[![Node.js 22.19+](https://img.shields.io/badge/Node.js-22.19%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

> DSH Codex Pet — это поддерживаемый сообществом плагин виртуального питомца для DeepSeek Harness (DSH), не являющийся официальным продуктом OpenAI или DeepSeek AI. Начиная с версии 1.0.1 поддерживаются DSH `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`–`0.2.1-rc.5`, `0.2.2-rc.1` и `0.2.2-rc.2`. Более ранние хосты и альфа-версии `0.2.1` отклоняются встроенным шлюзом версий; локальные настройки и созданные питомцы при этом сохраняются.

## Возможности

Ваш интерактивный спутник во время работы в DSH: следите за прогрессом задач и оперативно реагируйте на запросы. Выберите одного из 9 встроенных питомцев или создайте собственного с помощью встроенного навыка Skill.

- **9 встроенных питомцев**: выберите питомца и настройте его размер в панели управления. Все графические ресурсы поставляются локально.
- **Спутник прямо на странице**: работает непосредственно в веб-интерфейсе DSH.
- **Все задачи как на ладони**: отслеживайте выполняемые задачи, завершенные процессы, ошибки и ожидающие подтверждения действия. Когда уведомлений нет, отображается только питомец.
- **Действия прямо из уведомления**: откройте связанную беседу, остановите текущий раунд генерации или подтвердите запуск инструментов и ответьте на вопросы.
- **Тишина при необходимости**: закройте конкретное уведомление без прерывания задачи; скройте или верните питомца через контекстное меню или настройки.
- **Создание своего питомца**: опишите образ в настройках и запустите генерацию через встроенный навык `hatch-pet`.
- **Интерактивность**: перетаскивайте мышью, совершайте прыжки двойным кликом, вызывайте меню правой кнопкой мыши.

## Скриншоты

### Уведомления о задачах

Задачи отображаются рядом с питомцем с кнопками перехода в беседу, остановки раунда и закрытия уведомления.

<p align="center">
  <img src="assets/screenshots/pet-notifications.png" alt="Питомец с уведомлениями о задачах" width="403">
</p>

### Настройки питомца

Выбор из 9 питомцев, переход к папке пользовательских питомцев и настройка масштаба.

![Библиотека питомцев и внешний вид](assets/screenshots/pet-settings.png)

### Спутник в беседе

Работайте в DSH, пока питомец и уведомления аккуратно располагаются в углу экрана.

![Питомец рядом с окном беседы DSH](assets/screenshots/pet-conversation.png)

## Экосистема продуктов DSH

Для полноценной работы на ПК рекомендуем [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases). В существующие установки [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) плагины можно добавлять по мере необходимости:

| Плагин | Назначение |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Организация проектов и бесед, поиск по задачам и быстрая навигация |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Выбор и вызов специализированных агентов для задач |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Поиск, включение, создание и импорт локальных навыков |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Поиск, восстановление и удаление архивированных бесед |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Управление задачами через мессенджеры |
| [Automation](https://github.com/MichengAI/dsh-automation) | Запуск задач по расписанию и просмотр отчетов |
| [BTW](https://github.com/MichengAI/dsh-btw) | Задавайте попутные вопросы без прерывания основной сессии |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Улучшение качества кода в рамках изменений Git по команде `/simplify` |
| [PUA](https://github.com/MichengAI/dsh-pua) | Мотивация агента к поиску альтернатив при сбоях и обязательной проверке результата |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Независимый анализ кода отдельным агентом по команде `/review` |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Просмотр уведомлений и подтверждение запуска инструментов через питомца |

## Установка

Поддерживаемые версии DeepSeek Harness: **`0.2.0-rc.1`**, **`0.2.0-rc.2`**, **`0.2.1-rc.1`–`0.2.1-rc.5`**, **`0.2.2-rc.1`** и **`0.2.2-rc.2`**. Убедитесь, что утилита `dsh` доступна в терминале:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-codex-pet@latest --registry=https://registry.npmjs.org/ --ignore-scripts
```

Перезапустите DSH после установки и перейдите в **Настройки → Питомцы** (или **Settings → Pets**).

## Использование

Откройте **Настройки → Питомцы** или щелкните правой кнопкой мыши по питомцу.

| Действие | Инструкция |
| --- | --- |
| Выбрать питомца | Выберите питомца в настройках и задайте масштаб. |
| Перемещение и игра | Перетащите мышью; двойной клик для прыжка. |
| Просмотр статуса | Читайте уведомления; разверните список при нескольких задачах. |
| Открыть беседу | Кликните по уведомлению для перехода в задачу DSH. |
| Ответ на запрос | Разверните детали и подтвердите инструмент или ответьте на вопрос. |
| Остановка раунда | Нажмите на кнопку остановки в карточке выполняемой задачи. |
| Скрыть уведомление | Нажмите на крестик (задача продолжит выполняться). |
| Скрыть/показать питомца | Используйте контекстное меню или панель настроек. |

### Создание своего питомца

1. Откройте настройки питомца, нажмите на **+** (`Создать`) и введите описание.
2. Нажмите **Создать в DSH** — откроется отдельная задача с инструкциями навыка.
3. Дождитесь генерации (требуется инструмент генерации изображений в DSH).
4. Обновите библиотеку питомцев и выберите созданного спутника.

## Обновление и удаление

Для обновления:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-codex-pet@latest --registry=https://registry.npmjs.org/ --ignore-scripts
```

Для удаления:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web remove @michengai/dsh-codex-pet
```

Файлы созданных питомцев хранятся в `.dsh/codex-pet/pets` в вашей домашней папке. Удаление плагина не удаляет ваши файлы и настройки.

## Участие в разработке

Инструкции по локальной разработке, тестированию и публикации приведены в [руководстве по разработке и проверке (на китайском языке)](https://github.com/MichengAI/dsh-codex-pet/blob/main/CONTRIBUTING.md). Репозиторий GitHub и пакет npm содержат готовую сборку `lib`; после внесения изменений в исходный код выполните `npm run build` перед коммитом.

## Лицензия

Исходный код плагина распространяется под лицензией [Apache License 2.0](LICENSE). Пиксельная графика питомцев создана OpenAI Codex и исключена из лицензии Apache-2.0 данного репозитория; см. [NOTICE](NOTICE).
