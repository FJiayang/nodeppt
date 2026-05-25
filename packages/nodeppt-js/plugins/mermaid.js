import DOM from 'webslides/src/js/utils/dom';
import {default as Slide, Events as SlideEvents} from 'webslides/src/js/modules/slide';

/**
 * Mermaid 11.x 插件：进入 slide 时按需 run。
 * 同一 slide 可有多个 mermaid 块；window.mermaid 由 ESM 模块加载后挂载。
 */
export default class Mermaid {
    constructor(wsInstance) {
        this.ws_ = wsInstance;
        const nodes = DOM.toArray(this.ws_.el.querySelectorAll('.lang-mermaid'));
        if (!nodes.length) return;

        nodes.forEach((node) => {
            const {i} = Slide.getSectionFromEl(node);
            const slide = wsInstance.slides[i - 1];
            if (!slide.mermaidNodes) {
                slide.mermaidNodes = [];
                slide.mermaidInit = false;
                slide.el.addEventListener(SlideEvents.ENABLE, Mermaid.onSectionEnter);
            }
            slide.mermaidNodes.push(node);
        });
    }

    static onSectionEnter(event) {
        const slide = event.detail.slide || {};
        if (slide.mermaidInit || !slide.mermaidNodes || !slide.mermaidNodes.length) {
            return;
        }
        const run = () => Mermaid.renderSlide(slide);
        if (window.mermaid) {
            run();
        } else {
            // ESM 模块异步加载，等 'mermaid:loaded' 事件
            window.addEventListener('mermaid:loaded', run, {once: true});
        }
    }

    static renderSlide(slide) {
        if (slide.mermaidInit) return;
        slide.mermaidInit = true;
        const opts = (window.pluginsOptions && window.pluginsOptions.mermaid) || {};
        const theme = opts.theme || 'default';
        try {
            window.mermaid.initialize({startOnLoad: false, theme});
        } catch (err) {
            console.error('[mermaid] initialize failed:', err);
        }
        slide.mermaidNodes.forEach((n) => {
            n.style.visibility = 'visible';
        });
        Promise.resolve(window.mermaid.run({nodes: slide.mermaidNodes})).catch((err) => {
            console.error('[mermaid] render failed:', err);
            slide.mermaidInit = false;
        });
    }
}
