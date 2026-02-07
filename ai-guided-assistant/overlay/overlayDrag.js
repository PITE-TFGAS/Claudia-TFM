// SCRIPT ENCARGADO DE HACER EL CHAT ARRASTRABLE

console.log("Overlay Drag loaded");

// ---------------------------------------------------------
// FUNCIÓN QUE PERMITE MOVER EL OVERLAY
// ---------------------------------------------------------
function hacerDraggable() {
    const overlay = document.getElementById("asistente-overlay");
    const header = overlay ? overlay.querySelector(".asistente-header") : null;

    if (!overlay || !header) {
        setTimeout(hacerDraggable, 200);
        return;
    }

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.style.cursor = "move";
    header.style.userSelect = "none";

    header.addEventListener("mousedown", (e) => {
        if (e.target.closest("button") || e.target.closest("input")) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = overlay.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });

    function onMouseMove(e) {
        if (!isDragging) return;

        e.preventDefault(); 

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        overlay.style.position = "fixed";
        overlay.style.left = `${initialLeft + dx}px`;
        overlay.style.top = `${initialTop + dy}px`;
        overlay.style.bottom = "auto";
        overlay.style.right = "auto";
        overlay.style.transform = "none";
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        overlay.classList.remove("dragging");
    }
}

// Exponer la función globalmente
window.hacerDraggable = hacerDraggable;