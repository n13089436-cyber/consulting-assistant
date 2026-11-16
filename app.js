const form = document.getElementById('brief-form');
const output = document.getElementById('brief-output');
const resultSection = document.getElementById('result-section');
const resultEmpty = document.getElementById('result-empty');
const errorSummary = document.getElementById('error-summary');
const downloadButton = document.getElementById('download-brief');

// Кнопка скачивания доступна только после успешного формирования брифа.
let briefReady = false;

function setDownloadAvailable(value) {
  briefReady = value;
  downloadButton.disabled = !value;
}

const fields = Array.from(form.querySelectorAll('[data-field]'));

function isEmpty(value) {
  return value === null || value === undefined || value.trim() === '';
}

// Валидация обязательных полей.
// Значение, состоящее только из пробелов, считается пустым.
function validate() {
  let valid = true;
  const missing = [];

  fields.forEach((field) => {
    const required = field.dataset.required === 'true';
    const errorEl = document.getElementById('error-' + field.id);

    field.removeAttribute('aria-invalid');
    if (errorEl) {
      errorEl.textContent = '';
    }

    if (required && isEmpty(field.value)) {
      valid = false;
      field.setAttribute('aria-invalid', 'true');
      missing.push(field.dataset.title || field.name);
      if (errorEl) {
        errorEl.textContent = 'Это поле обязательно к заполнению.';
      }
    }
  });

  if (valid) {
    errorSummary.hidden = true;
    errorSummary.textContent = '';
  } else {
    errorSummary.hidden = false;
    errorSummary.textContent =
      'Пожалуйста, заполните обязательные поля: ' + missing.join(', ') + '.';
  }

  return valid;
}

function briefText(data) {
  const lines = [];

  lines.push('# Бриф по рабочему процессу');
  lines.push('');
  lines.push('## Описание процесса');
  lines.push('');
  lines.push('- **Название процесса:** ' + data.processName);
  lines.push('- **Цель процесса:** ' + data.processGoal);
  lines.push('');

  lines.push('## Событие запуска процесса');
  lines.push('');
  lines.push(
    '- ' + (isEmpty(data.triggerEvent) ? 'Не указано — нужно уточнить' : data.triggerEvent)
  );
  lines.push('');

  lines.push('## Основные действия и последовательность');
  lines.push('');
  lines.push(data.steps);
  lines.push('');

  lines.push('## Участники и ответственные');
  lines.push('');
  lines.push(
    '- ' + (isEmpty(data.participants) ? 'Не указано — нужно уточнить' : data.participants)
  );
  lines.push('');

  lines.push('## Используемые инструменты');
  lines.push('');
  lines.push('- ' + (isEmpty(data.tools) ? 'Не указано — нужно уточнить' : data.tools));
  lines.push('');

  lines.push('## Известные проблемы');
  lines.push('');
  lines.push('- ' + (isEmpty(data.problems) ? 'Не указано — нужно уточнить' : data.problems));
  lines.push('');

  lines.push('## Желаемый результат');
  lines.push('');
  lines.push('- ' + data.desiredResult);
  lines.push('');

  lines.push('---');
  lines.push(
    'Бриф подготовлен в приложении «Помощник консультанта». Данные вымышленные.'
  );

  return lines.join('\n');
}

function buildBrief() {
  const data = {};
  fields.forEach((field) => {
    data[field.id] = field.value;
  });
  return briefText(data);
}

form.addEventListener('submit', function (event) {
  event.preventDefault();

  if (!validate()) {
    return;
  }

  const text = buildBrief();
  // textContent не выполняет HTML — пользовательский ввод выводится как текст.
  output.textContent = text;
  output.hidden = false;
  resultSection.hidden = false;
  resultEmpty.hidden = true;
  setDownloadAvailable(true);
});

// Любое изменение формы делает бриф устаревшим: скачивание блокируется
// до повторного нажатия «Сформировать бриф».
fields.forEach((field) => {
  field.addEventListener('input', function () {
    setDownloadAvailable(false);
  });
});

downloadButton.addEventListener('click', function () {
  if (!briefReady) {
    return;
  }
  // ﻿ — BOM, чтобы Excel и другие программы открыли файл как UTF-8.
  const content = '﻿' + output.textContent;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'process-brief.md';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

document.getElementById('load-example').addEventListener('click', function () {
  // Загрузка примера меняет форму: бриф на странице устаревает.
  setDownloadAvailable(false);
  document.getElementById('processName').value = 'Обработка заявок клиентов';
  document.getElementById('processGoal').value =
    'Быстро и без потерь принимать заявки клиентов и передавать их исполнителям.';
  document.getElementById('triggerEvent').value =
    'Поступление письма в общую почту или сообщения в мессенджер.';
  document.getElementById('steps').value =
    [
      '1. Сотрудник проверяет общую почту и мессенджеры.',
      '2. Сотрудник переносит данные из сообщения в общую таблицу.',
      '3. Заявка остаётся в таблице без назначенного исполнителя.',
      '4. Исполнитель сам выбирает заявку из таблицы.',
    ].join('\n');
  document.getElementById('participants').value =
    'Менеджеры по продажам, операторы, исполнители.\nЕдиного ответственного нет.';
  document.getElementById('tools').value = 'Электронная почта, мессенджеры, общая таблица.';
  document.getElementById('problems').value =
    'По словам руководителя, некоторые обращения остаются без ответа.\nТочная частота и время ответа не измеряются.';
  document.getElementById('desiredResult').value =
    'Каждая заявка получает ответ в установленный срок и назначается на конкретного исполнителя.';
});
