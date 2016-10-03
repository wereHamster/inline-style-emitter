**TLDR**: Styles should be part of the (React) Virtual DOM tree, not treated
as an side-effect of rendering. With this library, rendering React components
remains pure, and you get to decide when and how the styles are emitted
(write into the browser DOM or out into a CSS file).

 - Styles are part of the React Element, and thus end up in the [jest] snapshot.
 - Rendering functions are kept pure.
 - CSS emitted before the DOM is updated, thus avoids [FOUC].

**Why does it exist**: Generating CSS rules can be viewed as part of
rendering. There is no reason, on the conceptual level, to have a split between
generating the markup and the corresponding style rules. The problem with inline
styles though is that they don't offer everything that is possible through
external CSS stylesheets: pseudo classes/elements and media queries. You can
work around this by re-implementing these browser-native features in your own
React code (what [Radium][radium] does). But that is additional work which
should not be necessary. The goal is to take advantage of the already existing
styling facilities provided by the browsers.

Current tools (of which there are [many][react-inline-css]) treat generating
CSS as part of the compile/build/bundle step. In doing so they require
complicated toolchains to extract the CSS rules from the source files.

**How it works**: The idea is to generate the CSS rules at the same time as
React elements, and then insert both into the browser at the same time.
Just like `ReactDOM.render` updates the DOM, a similar function is used to
update a `CSSStyleSheet` with the styles that are needed by the DOM. That way
we never generate more CSS rules than necessary for the current DOM.

Similar to how React can render the elements into a browser or into a string (for
server-side rendering), we can emit the CSS rules into the browser CSSStyleSheet
objects or into an external file. This means we can also generate a static site
while defining them with inline style syntax and still have the CSS rules
written into an external file!


### Example (browser)


```javascript
import React from "react";
import ReactDOM from "react/dom";
import {Handle, DocumentEmitter} from "inline-style-emitter";


// Some component which uses inline styles.
function Avatar({ url, username }) {
    return (
        <div style={{display:'flex',flexDirection:'row'}}>
            <img style={{display:'block',width:'20rem',height:'20rem'}}
                 src={url}
            />
            <div style={{flex:1}}>{username}</div>
        </div>
    );
}


// Create a Handle which manages all interaction with the DOM.
// Do this during startup and keep the Handle around forever.
let styleEmitterH = new Handle(new DocumentEmitter(document));

// The function which you use to render the React elements into
// your container.
function myRender(root, containerElement) {
    // Process the tree, from its root recursively, and generate
    // CSS rules from 'style' props. This also transforms the
    // elements and replaces style props with className.
    let newRoot = processStyleProperties(styleEmitterH, React, root);

    // Render the new root. At this point all the necessary CSS
    // rules have been inserted into the DOM and are visible by
    // the browser.
    ReactDOM.render(newRoot, containerElement);
}


// Now we render the avatar as our root. After this the document's
// head will contain a <style> element which holds the CSS rules
// which are required by the avatar.
myRender(<Avatar url="..." username="wereHamster" />,
    document.getElementById('root-container'));
```

[react-inline-css]: https://github.com/FormidableLabs/radium/tree/master/docs/comparison
[radium]: http://projects.formidablelabs.com/radium/
[jest]: https://facebook.github.io/jest/
[FOUC]: https://en.wikipedia.org/wiki/Flash_of_unstyled_content
