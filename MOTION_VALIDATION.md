# Актуальная проверка оригинального референса

Текущий вход демо — [demo/reference.html](demo/reference.html) и [demo/index.html](demo/index.html). Исполняются исходные английские тексты и фотографии Mindify, Apfel Grotezk, измеренные секции 1440 / 768 / 390. Предыдущий русскоязычный макет из Pen удалён.

В новой исполняемой копии проверены три размера: нет горизонтального overflow, фотографии загружены, ошибок JS нет. Проверены открытие/закрытие/повторное открытие меню, переход Services, drag ленты и реальные hover цветов кнопки и текстовой ссылки. Результаты — [reference-ui-check.json](output/control/reference-ui-check.json), кадры — `output/control/demo-*.jpg`. Эта проверка выполнена мышью в браузере с размерами 1440×1000, 768×1024 и 390×844; физический телефон не использовался.

Аналитический runtime не изменялся: повторно пройдено 2589 сравнений, 21 native easing, максимальная ошибка 2.28e-14. Ниже сохранены подробности численной проверки и более раннего расширенного сценария для того же runtime. Его старые скриншоты в `output/playwright/` не являются изображениями текущего Pen.

---

# Проверка анимаций Mindify → демо

Дата: 18.10.2026. Исходный сайт: [Mindify](https://mindify.framer.website/). Проверяемый результат: [demo/index.html](demo/index.html).

## Что изменено

- Удалена собственная нормализованная формула пружины и Euler-интегрирование. Локальные аналитические генераторы spring/inertia взяты из опубликованного Motion runtime; лицензия MIT сохранена в [demo/MOTION-LICENSE.md](demo/MOTION-LICENSE.md).
- Восстановлены duration/bounce-пружины 400/700 ms, physical springs кнопки 250/30/1 и тегов 500/60/1. Возврат numeric spring начинает движение из текущего значения; физическая spring сохраняет скорость при изменении цели.
- Native opacity получает тот же `linear()` easing, включая шаг выборки и округление, что runtime после hydration. Для появления слов сохранены stagger 75 ms, задержка вступления 300 ms, бейджа 500 ms и CTA 1000 ms. Заголовки in-view исходно скрыты, срабатывают при threshold 1 и не скрываются при обратной прокрутке.
- Цвета кнопки смешиваются с гамма-коррекцией RGB, как в Motion. Почтовая иконка использует spring вместо CSS cubic-bezier.
- Меню использует duration spring, задержку opacity 200 ms при открытии и 0 при закрытии. Быстрый повторный tap меняет направление из текущего состояния; высота измеряется по содержимому. Средняя линия скрывается, крайние совмещаются и вращаются на ±45°.
- Лента сохраняет скорость отпускания в обе стороны: `power=.8`, `timeConstant=750 ms`, `restDelta=1`, `restSpeed=10`. PanSession использует порог 3 px и историю скорости 100 ms, включая удержание перед отпусканием. Когда модуль скорости падает ниже 30 px/s или 6 px/s под курсором, auto подхватывает движение. Учтены округление animation time до ms, frame delta 1–40 ms и 30-ms окно MotionValue velocity.
- Координата drag не сбрасывается на шве. Копии покрывают текущую ширину окна, недоступны для повторного чтения screen reader. Сохранены дополнительные контролы демо: пауза, клавиши, focus и reduced motion.

## Численная сверка

`node scripts/verify-motion.mjs` проходит:

| Проверка | Результат |
|---|---|
| Spring values / velocity и inertia | 2 589 численных сравнений, допуск 10⁻⁹ |
| Максимальная абсолютная ошибка | 2.28 × 10⁻¹⁴ |
| Native opacity easing оригинала | 21 захваченная кривая совпала строка в строку |
| Drag | Обе стороны; handoff при 6/30 px/s; stale frame; удержание; wrap |
| Цвет | Гамма-коррекция RGB |

Oracle fixtures рассчитаны отдельно из minified функций `mt` / `gt` опубликованного модуля; native easing захвачен через наблюдение вызовов `Element.animate` в оригинальном сайте. Это сравнение с оригиналом, а не с копией реализации демо. Источники и SHA256: [reference/evidence.json](reference/evidence.json). Fixtures: [motion](reference/motion-fixtures.json), [native appear](reference/appear-fixtures.json). Сводка: [physics-check.json](output/playwright/physics-check.json).

В захвате также сохранены ранние SSR appear-анимации до hydration. Демо запускает собственный модуль без React/Framer SSR; сравнение 21 кривой относится к рабочему runtime после hydration. Задержки считаются от trigger, а не от начала сетевой загрузки документа.

## Браузерное сравнение ленты

Один сценарий выполнялся на оригинале и демо: auto → hover → flick влево → flick вправо → drag с удержанием. Измерялись реальные DOM transform на каждом кадре. На шве координаты разворачиваются в непрерывную траекторию. Константа затухания оценивалась по наклону log скорости.

| Измерение | Mindify | Демо |
|---|---:|---:|
| Auto, px/s | −30.012 | −30.000 |
| Hover, px/s | −6.001 | −6.000 |
| Оценка τ после flick влево, ms | 757.0 | 749.9 |
| Оценка τ после flick вправо, ms | 759.4 | 751.5 |
| После удержания, px/s | −5.997 | −6.000 |

Расчётное τ обоих runtime — 750 ms. Браузерная оценка содержит округление CSS transform, времени и планирование кадров; допуск сценария — ±40 ms. [Траектории оригинала](output/playwright/reference-ticker.json) · [Траектории демо](output/playwright/demo-ticker.json).

## Desktop и mobile QA

Chromium с реальными mouse/keyboard input и mobile touch через CDP. Размеры: 1440×1000, 768×1024 и 390×844. Мобильная проверка выполнена с `isMobile`, `hasTouch`, DPR 1; физический телефон и Safari отдельно не проверялись.

Проверены:

- Hero: повтор появления, промежуточный и конечный кадры, задержки/stagger.
- Кнопка, mail и обратный hover; меню open/close, быстрое open-close-open, Escape, закрытие по пункту.
- Auto, hover, инерция обоих направлений, остановка перед отпусканием, повторный захват во время движения, pause/resume и клавиши.
- Touch fling, повторный захват и удержание; вертикальный жест прокручивает страницу при `touch-action: pan-y`.
- Теги Hero при прямой/обратной прокрутке; in-view; фон CTA по progress документа; slider с клавиатуры 0/100.
- Reduced motion во время движения и при загрузке, включая меню.
- Fit всех трёх размеров, шрифт, изображения, layering и читаемость переходных/конечных состояний. Горизонтального overflow страницы и JavaScript exceptions не обнаружено. Обрезание крайних карточек внутри окна ленты — заданное `overflow: clip`.

Результаты: [ui-check.json](output/playwright/ui-check.json), [scroll-check.json](output/playwright/scroll-check.json). Инвентарь: [QA-INVENTORY.md](output/playwright/QA-INVENTORY.md). Воспроизводимые сценарии: `scripts/browser-*-check.cjs`, запуск через Playwright CLI `run-code --filename`.

Кадры: [desktop Hero](output/playwright/desktop-hero.png), [появление](output/playwright/desktop-hero-transition.png), [меню в переходе](output/playwright/desktop-menu-transition.png), [mobile Hero](output/playwright/mobile-hero.png), [mobile меню](output/playwright/mobile-menu-open.png), [mobile лента](output/playwright/mobile-ticker.png).

Совпадение относится к моделям движения, параметрам и проверенным состояниям. Тексты, Manrope, геометрия нового макета и демонстрационные отзывы отличаются от Mindify, поэтому одинаковые пиксели целых страниц не заявляются. Файл Pen содержит редактируемые состояния; этот этап изменяет исполняемое HTML-демо и документацию.
