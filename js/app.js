class Whiteboard {
    constructor() {
        this.canvas = document.getElementById('whiteboard');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'pencil';
        this.history = [];
        this.redoHistory = [];
        this.textInput = null;
        
        this.initializeCanvas();
        this.setupEventListeners();
        this.setupTools();
    }

    initializeCanvas() {
        const resizeCanvas = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.redrawFromHistory();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }

    setupTools() {
        // Tool selection
        document.querySelectorAll('.tool').forEach(tool => {
            tool.addEventListener('click', (e) => {
                document.querySelector('.tool.active').classList.remove('active');
                tool.classList.add('active');
                this.currentTool = tool.id;
            });
        });

        // Color picker
        document.getElementById('colorPicker').addEventListener('change', (e) => {
            this.ctx.strokeStyle = e.target.value;
        });

        // Stroke width
        document.getElementById('strokeWidth').addEventListener('change', (e) => {
            this.ctx.lineWidth = e.target.value;
        });

        // Undo
        document.getElementById('undo').addEventListener('click', this.undo.bind(this));

        // Redo
        document.getElementById('redo').addEventListener('click', this.redo.bind(this));

        // Clear
        document.getElementById('clear').addEventListener('click', this.clearCanvas.bind(this));

        // Save
        document.getElementById('save').addEventListener('click', this.saveCanvas.bind(this));
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.currentTool === 'text') {
            this.addTextInput(x, y);
            return;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.currentTool === 'eraser') {
            this.ctx.strokeStyle = '#f0f0f0';
        }

        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }

    addTextInput(x, y) {
        if (this.textInput) {
            this.commitText();
        }

        this.textInput = document.createElement('input');
        this.textInput.type = 'text';
        this.textInput.style.position = 'fixed';
        this.textInput.style.left = x + 'px';
        this.textInput.style.top = y + 'px';
        this.textInput.style.background = 'transparent';
        this.textInput.style.border = 'none';
        this.textInput.style.outline = 'none';
        this.textInput.style.color = this.ctx.strokeStyle;
        this.textInput.style.font = `${this.ctx.lineWidth * 5}px Arial`;

        document.body.appendChild(this.textInput);
        this.textInput.focus();

        this.textInput.addEventListener('blur', this.commitText.bind(this));
        this.textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.commitText();
            }
        });
    }

    commitText() {
        if (this.textInput && this.textInput.value) {
            const rect = this.canvas.getBoundingClientRect();
            const x = parseInt(this.textInput.style.left) - rect.left;
            const y = parseInt(this.textInput.style.top) - rect.top;

            this.ctx.font = this.textInput.style.font;
            this.ctx.fillStyle = this.textInput.style.color;
            this.ctx.fillText(this.textInput.value, x, y);
            
            this.saveState();
        }

        if (this.textInput) {
            this.textInput.remove();
            this.textInput = null;
        }
    }

    saveState() {
        this.history.push(this.canvas.toDataURL());
        this.redoHistory = [];
    }

    undo() {
        if (this.history.length > 0) {
            this.redoHistory.push(this.canvas.toDataURL());
            this.redrawFromData(this.history.pop());
        }
    }

    redo() {
        if (this.redoHistory.length > 0) {
            this.history.push(this.canvas.toDataURL());
            this.redrawFromData(this.redoHistory.pop());
        }
    }

    redrawFromData(dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
    }

    redrawFromHistory() {
        if (this.history.length > 0) {
            this.redrawFromData(this.history[this.history.length - 1]);
        }
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the whiteboard?')) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveState();
        }
    }

    saveCanvas() {
        const link = document.createElement('a');
        link.download = 'whiteboard.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// Initialize the whiteboard when the page loads
window.addEventListener('load', () => {
    new Whiteboard();
});
