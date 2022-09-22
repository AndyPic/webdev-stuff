# webdev-stuff

# Vanilla JS

<details close>
<summary>
<b>ModalElement.js</b>
</summary>

Creates a 'basic' modal element in the DOM, and provides some useful functionality.

Usage:

Create a modal, using the default style.
```JavaScript
const modal = new ModalElement(true);
```

Create a modal, with no styling.
```JavaScript
const modal = new ModalElement(false); // Or empty constructor
```

Change Submit / Decline button text
```JavaScript
modal.confirmText = "Confirm";
modal.declineText = "Decline";
```

Start a new modal:
```JavaScript
modal.start(
	"Good Title", // The title
	"Better Description", // The description
	[() => console.log('End')], // Functions executed when the modal ends
    [() => console.log('Confirm')], // Functions executed when the confirm button pressed
    [() => console.log('Decline')], // Functions executed when the decline button pressed
    [() => console.log('Start')], // Functions executed when the modal starts
);
```
</details>






