/**
 * Копирует переданный текст в буфер обмена.
 * @param {string} text - Текст для копирования.
 * @returns {Promise<void>}
 * @throws {Error} Если копирование не удалось.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    throw new Error("Не удалось скопировать текст в буфер обмена.");
  }
}


/**
 * Получает значение параметра из URL или возвращает все параметры.
 * @param {string} [p] - Название параметра для получения.
 * @param {string} [source=location.href] - Источник URL.
 * @returns {any} Значение параметра или объект всех параметров.
 */
export function queryParam(p, source = location.href) {
  const queryString = source.split('?')[1] || '';
  const params = {};

  queryString.split('&').forEach(kv => {
    if (!kv) return;
    const [key, value] = kv.split('=');
    try {
      params[key] = JSON.parse(decodeURIComponent(value));
    } catch {
      params[key] = decodeURIComponent(value);
    }
  });

  return p ? params[p] : params;
}

/**
 * Преобразует объект параметров в строку query.
 * @param {Object} p - Объект с параметрами.
 * @returns {string} Строка query.
 */
export function params2query(p) {
  return Object.entries(p)
    .map(([k, v]) => `${k}=${encodeURIComponent(typeof v === 'object' ? JSON.stringify(v) : v)}`)
    .join('&');
}

/**
 * Выполняет callback, как только DOM готов.
 * @param {Function} cb - Функция для выполнения.
 * @returns {Promise<void>}
 */
export async function asap(cb) {
  if (['complete', 'interactive'].includes(document.readyState)) {
    cb?.();
    return Promise.resolve();
  }
  return new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', () => {
      cb?.();
      resolve();
    });
  });
}

/**
 * Преобразует различные типы данных в массив DOM-узлов.
 * @param {any} what - Строка-селектор, Node, NodeList, массив или jQuery-объект.
 * @returns {Node[]} Массив DOM-узлов.
 * @throws {Error} Если передан неподдерживаемый тип.
 */
export function arrayOfNodesWith(what) {
  if (what?.jquery) {
    return what.toArray();
  }
  if (Array.isArray(what)) {
    return what.flatMap(item => arrayOfNodesWith(item));
  }
  if (what instanceof Node) {
    return [what];
  }
  if (what instanceof NodeList || what instanceof HTMLCollection) {
    return Array.from(what);
  }
  if (typeof what === 'string') {
    return Array.from(document.querySelectorAll(what));
  }
  throw new Error(`arrayOfNodesWith: Неподдерживаемый тип параметра: ${what}`);
}

/**
 * Ожидает появления элемента React-приложения в DOM и его отрисовки.
 * @param {string} [selector="#__next > div"] - CSS-селектор хоста React-приложения.
 * @param {number} [timeout=200] - Интервал проверки в миллисекундах.
 * @returns {Promise<void>}
 */
export async function hostReactAppReady(selector = "#__next > div", timeout = 200) {
  return new Promise((resolve) => {
    const checkReady = () => {
      const hostEl = document.querySelector(selector);
      if (hostEl?.getBoundingClientRect().height) {
        resolve();
      } else {
        setTimeout(checkReady, timeout);
      }
    };
    checkReady();
  });
}

/**
 * Отслеживает соответствие размера экрана указанному порогу.
 * @param {number} size - Максимальная ширина (в px) для срабатывания условия.
 * @param {Function} callback - Callback с булевым значением: true, если ширина подходит.
 */
export function mediaMatcher(size, callback) {
  const mediaQuery = window.matchMedia(`(max-width: ${size}px)`);
  callback(mediaQuery.matches);
  mediaQuery.addEventListener("change", (e) => callback(e.matches));
}

/**
 * Назначает событие Яндекс.Метрики на клик по элементу.
 * @param {Element} selector - DOM-элемент для отслеживания.
 * @param {number|string} targetId - ID счетчика Яндекс.Метрики.
 * @param {string} target - Название цели.
 */
export function setYMTarget(selector, targetId, target) {
  selector.addEventListener("click", () => {
    ym(targetId, "reachGoal", target);
  });
}

/**
 * Асинхронно загружает внешний скрипт и выполняет callback после загрузки.
 * @param {string} url - URL скрипта.
 * @param {Function} [cb] - Callback после загрузки скрипта.
 * @returns {Promise<void>}
 */
export async function preloadScript(url, cb) {
  return new Promise(resolve => {
    const scriptEl = document.createElement('script');
    scriptEl.src = url;
    scriptEl.addEventListener('load', () => {
      scriptEl.remove();
      cb?.();
      resolve();
    });
    document.head.append(scriptEl);
  });
}

/**
 * Автоматически запускает и останавливает Vimeo-видео при появлении в зоне видимости.
 * @param {Object} [observerOptions={}] - Настройки IntersectionObserver.
 * @returns {Promise<void>}
 */
export async function vimeoAutoPlay(observerOptions = {}) {
  const vboxes = document.querySelectorAll('.vimeo-video-box [data-vimeo-vid]');
  if (!vboxes.length) return;

  await preloadScript('https://player.vimeo.com/api/player.js');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const target = entry.target;
      if (entry.isIntersecting) {
        if (!target['vimeo-player']) {
          target['vimeo-player'] = new Vimeo.Player(target, {
            id: target.dataset.vimeoVid,
            background: 1,
            playsinline: 1,
            autopause: 0,
            title: 0,
            byline: 0,
            portrait: 0,
            autoplay: 1,
            muted: 1,
          });
          target['vimeo-player'].on('play', function () {
            this.element.parentElement.classList.add('playback');
          });
        }
        target['vimeo-player'].play();
      } else {
        target['vimeo-player']?.pause();
      }
    });
  }, {threshold: 0.33, ...observerOptions});

  vboxes.forEach(box => io.observe(box));
}

/**
 * Вставляет шаблон Vimeo-видео в указанный контейнер,
 * используя переданные ID для десктопной и мобильной версии.
 *
 * @param {{ desktopId: string, mobileId: string }} ids - Объект с Vimeo ID.
 * @param {HTMLElement} container - DOM-элемент, в который будет вставлен шаблон.
 */
export async function insertVimeoBox(ids, container) {
  const tpl = document.getElementById("vimeoVideoBox");
  const clone = tpl.content.cloneNode(true);

  clone.querySelector(".hidden-on-mobile").dataset.vimeoVid = ids.desktopId;
  clone.querySelector(".hidden-on-desktop").dataset.vimeoVid = ids.mobileId;

  container.prepend(clone);
}

/**
 * Получает данные Next.js из DOM.
 * @returns {Object|undefined} Объект данных Next.js или undefined.
 */
export function getNextData() {
  const configEl = document.getElementById('__NEXT_DATA__');
  return configEl ? JSON.parse(configEl.textContent) : window.__NEXT_DATA__;
}

/**
 * Отслеживает пересечение элементов с зоной видимости.
 * @param {string|Node|NodeList|Array} targets - Целевые элементы.
 * @param {Object} options - Настройки IntersectionObserver.
 * @param {Function} yesHandler - Callback при появлении в зоне видимости.
 * @param {Function} [noHandler] - Callback при выходе из зоны видимости.
 * @returns {IntersectionObserver}
 */
export function watchIntersection(targets, options, yesHandler, noHandler) {
  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      entry.isIntersecting
        ? yesHandler?.call(this, entry.target, observer)
        : noHandler?.call(this, entry.target, observer);
    });
  }, {threshold: 1, ...options});

  arrayOfNodesWith(targets).forEach(node => io.observe(node));
  return io;
}
