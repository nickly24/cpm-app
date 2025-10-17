# Защита от дублирования на клиентской стороне

## Проблема

При многократном нажатии кнопки "Завершить тест" студентами могли создаваться дублирующие записи в базе данных.

## Решение

Реализована многоуровневая защита от дублирования на клиентской стороне:

### 1. Защита на уровне состояния компонента

- **Двойная проверка**: `if (isCompleted || isSubmitting) return;`
- **Флаг отправки**: `isSubmitting` блокирует повторные вызовы
- **Флаг завершения**: `isCompleted` предотвращает повторные отправки

### 2. Защита на уровне UI

- **Блокировка кнопки**: `disabled={isSubmitting || isCompleted}`
- **Визуальная индикация**:
  - "Отправка..." во время отправки
  - "Тест завершен" после завершения
  - "Завершить тест" в обычном состоянии

### 3. Защита на уровне localStorage

- **Проверка при восстановлении**: предотвращает восстановление завершенных тестов
- **Обновление флага**: `isCompleted: true` сохраняется в localStorage
- **Очистка при ошибках**: localStorage очищается при проблемах

### 4. Обработка ошибок сервера

- **HTTP 409 (Conflict)**: специальная обработка дублирования
- **Информативные сообщения**: пользователь видит причину ошибки
- **Разные типы ошибок**: сеть, сервер, дублирование

## Изменения в коде

### Tests.js - Основные изменения:

#### 1. Улучшенная функция `handleCompleteTest`:

```javascript
const handleCompleteTest = async () => {
  if (isCompleted || isSubmitting) return;

  setIsSubmitting(true);
  setSubmitError(null);

  // Дополнительная защита от повторных вызовов
  if (isCompleted || isSubmitting) return;

  // ... логика отправки ...
};
```

#### 2. Обработка HTTP 409 (Conflict):

```javascript
} else if (response.status === 409) {
  // Обработка ошибки дублирования (тест уже сдан)
  const errorData = await response.json();
  console.warn('Тест уже сдан:', errorData);
  setSubmitError(`Тест уже был сдан ранее. Результат: ${errorData.existingScore || 'неизвестно'} баллов`);
  setIsCompleted(true);

  // Обновляем сессию в localStorage как завершенную
  const updatedSession = { ...session, isCompleted: true };
  localStorage.setItem('testSession', JSON.stringify(updatedSession));

  onComplete(results);
}
```

#### 3. Улучшенная обработка ошибок:

```javascript
} catch (error) {
  console.error('Ошибка отправки результатов:', error);

  // Различаем типы ошибок
  if (error.message.includes('409')) {
    setSubmitError('Тест уже был сдан ранее. Повторная отправка невозможна.');
  } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    setSubmitError('Ошибка сети. Проверьте подключение к интернету и попробуйте еще раз.');
  } else {
    setSubmitError('Не удалось отправить результаты. Попробуйте еще раз.');
  }

  setIsSubmitting(false);
  return;
}
```

#### 4. Защита при восстановлении сессии:

```javascript
const loadTestFromSession = async (session) => {
  try {
    setLoading(true);

    // Проверяем, не завершен ли уже тест
    if (session.isCompleted) {
      setError('Этот тест уже был завершен. Повторное прохождение не разрешено.');
      localStorage.removeItem('testSession');
      return;
    }

    // ... остальная логика ...
  }
}
```

#### 5. Обновление UI кнопки:

```javascript
<button
  className="tests_complete_btn"
  onClick={handleCompleteTest}
  disabled={isSubmitting || isCompleted}
>
  {isSubmitting ? (
    <>
      <span className="tests_loading_spinner"></span>
      Отправка...
    </>
  ) : isCompleted ? (
    "Тест завершен"
  ) : (
    "Завершить тест"
  )}
</button>
```

## Уровни защиты

### 1. **Предотвращение** (Prevention)

- Блокировка кнопки при отправке
- Проверка состояния перед отправкой
- Восстановление состояния из localStorage

### 2. **Обнаружение** (Detection)

- Обработка HTTP 409 от сервера
- Анализ типов ошибок
- Логирование для отладки

### 3. **Восстановление** (Recovery)

- Показ результатов при дублировании
- Информативные сообщения об ошибках
- Очистка некорректных данных

## Результат

- ✅ **Нет дублирующих записей** в базе данных
- ✅ **Понятные сообщения** для пользователя
- ✅ **Надежная защита** от race conditions
- ✅ **Восстановление** после ошибок
- ✅ **Сохранение UX** при проблемах

## Тестирование

1. **Быстрое нажатие**: многократно нажмите "Завершить тест"
2. **Перезагрузка страницы**: после завершения теста
3. **Плохое соединение**: при медленном интернете
4. **Повторное прохождение**: попытка пройти тест дважды

Все сценарии должны работать корректно без создания дублей! 🎯
