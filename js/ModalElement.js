/**
 * @author Andrew Pickard
 */
class ModalElement {
    /** @type {HTMLElement} */
    #modal;

    /** @type {HTMLElement} The element focused, before the modal started */
    #preModalFocusTarget = null;

    /** @type {Array} */
    #registeredListeners = []

    /** @type {Event} Event triggered when the modal starts */
    #onStart;
    /** @type {Event} Event triggered when the modal ends */
    #onEnd;
    /** @type {Event} Event triggered when confirming the modal */
    #onConfirm;
    /** @type {Event} Event triggered when declining the modal */
    #onDecline;

    /** @type {boolean} is the modal currently active */
    #isActive = false;

    /** @type {boolean} is the modal currently active */
    get isActive() {
        return this.#isActive;
    }

    get #DEFAULT_CONFIRM_TEXT() {
        return "Ok";
    }

    get #DEFAULT_DECLINE_TEXT() {
        return "Decline";
    }

    /** 
     * The text that is displayed on the 'confirm' button.
     * @note Pass null to reset to default.
     * @param {string} newText
     */
    set confirmText(newText) {
        if (newText)
            this.#getModalChild("md-confirm").innerText = newText;
        else
            this.#getModalChild("md-confirm").innerText = this.#DEFAULT_CONFIRM_TEXT;
    }

    /** 
     * The text that is displayed on the 'decline' button.
     * @note Pass null to reset to default.
     * @param {string} newText
     */
    set declineText(newText) {
        if (newText)
            this.#getModalChild("md-decline").innerText = newText;
        else
            this.#getModalChild("md-decline").innerText = this.#DEFAULT_DECLINE_TEXT;
    }

    /** 
     * Construct a new modal in the DOM.
     * @param {boolean} generateCSS Should CSS be generated for the modal.
     */
    constructor(generateCSS) {
        // Handle the CSS
        if (generateCSS) {
            let style = this.#buildStyle();
            this.#appendAfterLoad(style);
        }

        // Handle the modal element
        this.#buildModal();
        this.#appendAfterLoad(this.#modal);

        // Set up events
        this.#onEnd = new CustomEvent("modalEnd");
        this.#onStart = new CustomEvent("modalStart");
        this.#onConfirm = new CustomEvent("modalConfirm");
        this.#onDecline = new CustomEvent("modalDecline");
    }

    /**
     * @param {string} childClassName 
     * @returns {HTMLElement} The child element.
     */
    #getModalChild(childClassName) {
        return this.#modal.getElementsByClassName(childClassName)[0];
    }

    /**
     * Creates the base modal element.
     */
    #buildModal() {
        this.#modal = document.createElement("div");
        this.#modal.classList.add("modal");
        this.#modal.addEventListener("click", event => { if (event.composedPath()[0] == this.#modal) this.end() });

        let content = document.createElement("div");
        this.#modal.appendChild(content);
        content.setAttribute("tabindex", "-1");
        content.classList.add("md-content");

        let close = document.createElement("button");
        close.innerHTML = "&times"
        close.classList.add("md-btn", "md-close");
        close.setAttribute("type", "button");
        close.setAttribute("title", "Close");
        close.addEventListener("click", () => this.end());

        let title = document.createElement("h2");
        title.classList.add("md-title");

        let description = document.createElement("p");
        description.classList.add("md-description");

        let buttonContainer = document.createElement("div");
        buttonContainer.classList.add("md-button-container");

        let confirm = document.createElement("button");
        confirm.classList.add("md-btn", "md-confirm");
        confirm.innerText = this.#DEFAULT_CONFIRM_TEXT;
        confirm.addEventListener("click", () => {
            this.invokeEvent(this.#onConfirm);
            this.end();
        });

        let decline = document.createElement("button");
        decline.classList.add("md-btn", "md-decline");
        decline.innerText = this.#DEFAULT_DECLINE_TEXT;
        decline.addEventListener("click", () => {
            this.invokeEvent(this.#onDecline);
            this.end();
        });

        // Append buttons
        [confirm, decline].forEach(element => buttonContainer.appendChild(element));

        // Append elements to content
        [close, title, description, buttonContainer].forEach(element => content.appendChild(element));
    }

    /**
     * Creates the default style for the modal element.
     * @returns {HTMLElement} The style element.
     */
    #buildStyle() {
        let style = document.createElement("style");
        style.id = "md-style"

        style.innerHTML = `
        .modal {
            display:none;
            position:fixed;
            top:0;
            left:0;
            width:100%;
            height:100%;
            background-color:rgba(0,0,0,0.25);
            z-index:10;
        }
        .md-content {
            position:absolute;
            top:0;
            bottom:25%;
            right:0;
            left:0;
            margin:auto;
            max-width:100%;
            min-width:min(50%, 140px);
            width:fit-content;
            height:fit-content;
            padding:18px;
            background-color:white;
            box-shadow: 2px 3px 7px 0px rgb(0 0 0 / 20%);
        }
        .md-close {
            position:absolute;
            top:0;
            right:0;
            line-height:0.55;
            font-size: 26px;
        }
        .md-title {
            margin-top:0;
        }
        .md-button-container {
            display:flex;
            justify-content:space-evenly;
        }
        .md-confirm,
        .md-decline {
            display:none;
        }
        .md-btn {
            padding:4px;
            cursor:pointer;
            border-radius:0;
            border:none;
            outline:none;
        }
        .md-btn:hover,
        .md-btn:focus {
            color:white;
            background-color:black;
        }
        `;

        return style;
    }

    /**
     * Append the @param elementToAppend to the document body, after the DOM has loaded.
     * @param {HTMLElement} elementToAppend
     */
    #appendAfterLoad(elementToAppend) {
        document.addEventListener("DOMContentLoaded", () => {
            document.body.appendChild(elementToAppend);
        }, { once: true });
    }

    /**
     * Enables the modal with the passed title and description, registers passed actions to execute on
     * corresponding event. If no confirm / decline functions are passed, their buttons will not be enabled.
     * @param {string} title 
     * @param {string} description 
     * @param {Array<Function>} onEndActions actions to be executed when the modal closes.
     * @param {Array<Function>} onConfirmActions actions to be executed on confirm.
     * @param {Array<Function>} onDeclineActions actions to be executed on decline. 
     * @param {Array<Function>} onStartActions actions to be executed when the modal starts.
     */
    start(title = "", description = "", onEndActions, onConfirmActions, onDeclineActions, onStartActions) {

        if (this.#isActive)
            throw new Error(`Can't start new modal before previous ends.`);
        
        // Set up data
        this.#getModalChild("md-title").innerHTML = title;
        this.#getModalChild("md-description").innerHTML = description;

        // Set up on-start actions
        this.registerActions(this.#onStart.type, onStartActions);

        // Set up on-confirm actions
        this.registerActions(this.#onConfirm.type, onConfirmActions);

        // Set up on-decline actions
        this.registerActions(this.#onDecline.type, onDeclineActions);

        // Set up on-end actions
        this.registerActions(this.#onEnd.type, onEndActions);

        // Ensure any un-spent actions are removed on-end
        this.registerActions(this.#onEnd.type, [
            () => {
                this.#registeredListeners.forEach(registeredListener => {
                    this.#modal.removeEventListener(registeredListener.type, registeredListener.listener);
                });
                this.#registeredListeners = [];
            }
        ]);

        // Set up confirm / decline buttons
        if (onConfirmActions !== undefined)
            this.#getModalChild("md-confirm").style.display = "block";
        else
            this.#getModalChild("md-confirm").style.removeProperty("display");

        if (onDeclineActions !== undefined)
            this.#getModalChild("md-decline").style.display = "block";
        else
            this.#getModalChild("md-decline").style.removeProperty("display");

        // Enable modal
        this.#modal.style.display = "block";

        // Focus the modal
        this.#preModalFocusTarget = document.activeElement;
        this.#getModalChild("md-content").focus();

        // Invoke start events
        this.invokeEvent(this.#onStart);

        this.#isActive = true;
    }

    /**
     * Disables the modal, and executes on close event.
     */
    end() {
        // Disable modal
        this.#modal.style.removeProperty("display");

        // Return focus
        this.#preModalFocusTarget?.focus();
        this.#preModalFocusTarget = null;

        // Trigger on-end event
        this.invokeEvent(this.#onEnd);

        this.#isActive = false;
    }

    /**
     * Registers @param onCloseActions to fire when modal is closed.
     * @param {Array<Function>} actions actions to be executed when the modal closes
     */
    registerActions(eventIdentifier, actions) {
        if (!actions) // Guard clause for null actions
            return;

        // Store in registered listeners
        let index = this.#registeredListeners.push({
            type: eventIdentifier,
            listener: () => {
                actions.forEach(action => action());
            }
        }) - 1;

        // Add event listener
        this.#modal.addEventListener(
            eventIdentifier,
            this.#registeredListeners[index].listener
        );
    }

    /**
     * Invokes he passed event and removes any registered listeners for that event.
     * @param {Event} event 
     */
    invokeEvent(event) {
        // Dispatch events
        this.#modal.dispatchEvent(event);

        // Remove any from registered
        for (let i = this.#registeredListeners.length - 1; i >= 0; i--) {
            const el = this.#registeredListeners[i];

            if (el.type == event.type) {
                this.#registeredListeners.splice(i, 1);
                this.#modal.removeEventListener(el.type, el.listener);
            }
        }

    }
}
