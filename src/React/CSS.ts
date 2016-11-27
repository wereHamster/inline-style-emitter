// We're not actually importing any bindings from React, just types.
import { Props, ReactType, ReactElement, ReactNode,
    ComponentClass, StatelessComponent } from "react";

import { Maybe, maybe, catMaybes } from "../Data/Maybe";

import { CSSStyle, cssStyleRules, Emitter } from "../Data/CSS";



// -----------------------------------------------------------------------------

export class Handle {

    typeWrappers: WeakMap<any, any> = new WeakMap();
    // ^ Cache for React type wrappers. This is needed because React uses
    // reference equality to check if the type has changed or not.
    //
    // See 'wrapType' and 'mkTypeWrapper'.


    constructor
    ( private React // typeof React 
    , private emitter: Emitter
    ) {}


    private newProps = (style: CSSStyle, className: Maybe<string>): Maybe<{ style: undefined, className: string }> => {
        this.emitter.emitStyle(style);

        return {
            style: undefined,
            className: maybe("", x => `${x} `, className) + catMaybes(cssStyleRules(style).map(x =>
                x.type === 1 ? x.className : undefined)).join(" "),
        };
    }

    wrapElement = (el: null | ReactElement<any>): null | ReactElement<any> => {
        if (el === null) {
            return null;
        }

        const {React} = this;
        const type = el.type;

        if (typeof type === "function") {
            // ComponentClass<any> | StatelessComponent<any>
            return React.createElement(this.wrapType(type), el.props);

        } else if (typeof type === "string") {
            const oldProps    = <{ children?, style?, className? }> el.props
                , oldChildren = oldProps.children
                , style       = oldProps.style;

            const newChildren = oldChildren
                ? this.wrapNode(oldChildren)
                : undefined;

            // fmap over Maybe... 
            const newProps = style !== undefined
                ? this.newProps(style, oldProps.className)
                : undefined;

            // Avoid cloning the element if neither the props nor the children have
            // changed.
            return newProps === undefined && newChildren === undefined
                ? el : React.cloneElement(el, newProps, newChildren);

        } else {
            // Ohoh, the type is neither a function nor a string?
            throw new TypeError(`wrapElement: unknown type ${typeof type}`);
        }
    };

    private wrapNode = (node: ReactNode): ReactNode => {
        if (Array.isArray(node)) {
            return this.React.Children.map(node, this.wrapNode);
        } else if (this.React.isValidElement(node)) {
            return this.wrapElement(<any>node);
        } else { // string | number | boolean | {}
            return node;
        }
    };

    // Wrap a component class or stateless component in a new type so that we can
    // process its children.
    private wrapType = (type: ComponentClass<any> | StatelessComponent<any>): ReactType => {
        let w = this.typeWrappers.get(type);

        if (w === undefined) {
            w = this.mkTypeWrapper(type);
            this.typeWrappers.set(type, w);
        }

        return w;
    };

    private mkTypeWrapper = (type: ComponentClass<any> | StatelessComponent<any>): ReactType => {
        const {React, wrapElement} = this;

        if (type.prototype && type.prototype instanceof React.Component) {
            return <any> class extends (<ComponentClass<any>>type.prototype.constructor) {
                render() { return wrapElement(super.render()); }
            };
        } else {
            return (props, context) => wrapElement((<any>type)(props, context));
        }
    };
}


export const newHandle = (React: any, emitter: Emitter): Handle =>
    new Handle(React, emitter);

export const wrapElement = (h: Handle, el: null | ReactElement<any>): null | ReactElement<any> =>
    h.wrapElement(el);